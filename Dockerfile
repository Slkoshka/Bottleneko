# syntax=docker/dockerfile:1.7-labs

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-dotnet

ARG VERSION_SUFFIX="-local"

WORKDIR /src

# Restore
COPY --parents ./**/*.slnx ./
COPY --parents ./**/*.csproj ./
COPY --parents ./**/*.esproj ./
COPY --parents ./**/*.props ./
RUN dotnet restore

# Publish
COPY . .
ENV VERSION_SUFFIX=$VERSION_SUFFIX
RUN set -eux; \
    kernelArch="$(uname -m)"; \
    case "${kernelArch##*-}" in \
        x86_64) dotnetArch='linux-x64' ;; \
        aarch64) dotnetArch='linux-arm64' ;; \
        *) echo "Unsupported architecture: ${kernelArch##*-}"; exit 1 ;; \
    esac; \
    dotnet publish ./Bottleneko.Server/Bottleneko.Server.csproj -c Release -r ${dotnetArch} /p:VersionSuffix=${VERSION_SUFFIX} /p:WarningLevel=0 -o /app

FROM node:25-slim AS build-node
WORKDIR /src

# Install packages
COPY ./Bottleneko.Client/package.json ./
COPY ./Bottleneko.Client/package-lock.json ./
RUN npm install

# Publish
COPY ./Bottleneko.Client/ .
RUN npm run build -- --outDir /app/ --emptyOutDir

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
COPY --from=build-dotnet /app .
COPY --from=build-node /app ./wwwroot
RUN mkdir /data

ENTRYPOINT ["dotnet", "Bottleneko.Server.dll", "--bind", "http://0.0.0.0:5000", "--db", "/data/bottleneko.db"]
EXPOSE 5000
