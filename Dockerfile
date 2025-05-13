FROM mcr.microsoft.com/dotnet/sdk:9.0@sha256:fe3c1ed472bb0964c100f06aa9b1759f5ed84e0dfe6904d60f6a82159d3c7ae4 AS build-dotnet
WORKDIR /src

# Restore
COPY ./*.sln ./
COPY ./*.props ./
COPY */*.csproj ./
COPY */*.esproj ./
RUN for file in $(ls *.csproj *.esproj); do mkdir -p ${file%.*} && mv $file ${file%.*}; done
RUN dotnet restore

# Publish
COPY . .
RUN set -eux; \
    dpkgArch="$(dpkg --print-architecture)"; \
	case "${dpkgArch##*-}" in \
        amd64) dotnetArch='linux-x64' ;; \
        arm64) dotnetArch='linux-arm64' ;; \
        *) echo "Unsupported architecture: ${dpkgArch##*-}"; exit 1 ;; \
    esac; \
    dotnet publish ./Bottleneko.Server -c Release -r ${dotnetArch} -o /app

FROM node:24-slim@sha256:f403f3b5054f8f35ebe8dd167e0c608945a8fd992f3d278d2a8652b58b80dc92 AS build-node
WORKDIR /src

# Install packages
COPY ./Bottleneko.Client/package.json ./
COPY ./Bottleneko.Client/package-lock.json ./
RUN npm install

# Publish
COPY ./Bottleneko.Client/ .
RUN npm run build -- --outDir /app/ --emptyOutDir

FROM mcr.microsoft.com/dotnet/aspnet:9.0@sha256:96db63a87bb638bf3189a1763f0361f52a7793bca2a8056d2f4f2ac91915bccf AS base
WORKDIR /app
COPY --from=build-dotnet /app .
COPY --from=build-node /app ./wwwroot
RUN mkdir /data

ENTRYPOINT ["dotnet", "Bottleneko.Server.dll", "--bind", "http://0.0.0.0:5000", "--db", "/data/bottleneko.db"]
EXPOSE 5000
