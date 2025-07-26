# syntax=docker/dockerfile:1.7-labs

FROM mcr.microsoft.com/dotnet/sdk:9.0@sha256:86fe223b90220ec8607652914b1d7dc56fc8ff422ca1240bb81e54c4b06509e6 AS build-dotnet

ARG VERSION_SUFFIX="-local"

WORKDIR /src

# Restore
COPY --parents ./**/*.sln ./
COPY --parents ./**/*.csproj ./
COPY --parents ./**/*.esproj ./
COPY --parents ./**/*.props ./
RUN dotnet restore

# Publish
COPY . .
ENV VERSION_SUFFIX=$VERSION_SUFFIX
RUN set -eux; \
    dpkgArch="$(dpkg --print-architecture)"; \
	case "${dpkgArch##*-}" in \
        amd64) dotnetArch='linux-x64' ;; \
        arm64) dotnetArch='linux-arm64' ;; \
        *) echo "Unsupported architecture: ${dpkgArch##*-}"; exit 1 ;; \
    esac; \
    dotnet publish ./Bottleneko.Server/Bottleneko.Server.csproj -c Release -r ${dotnetArch} /p:VersionSuffix=${VERSION_SUFFIX} -o /app

FROM node:24-slim@sha256:36ae19f59c91f3303c7a648f07493fe14c4bd91320ac8d898416327bacf1bbfa AS build-node
WORKDIR /src

# Install packages
COPY ./Bottleneko.Client/package.json ./
COPY ./Bottleneko.Client/package-lock.json ./
RUN npm install

# Publish
COPY ./Bottleneko.Client/ .
RUN npm run build -- --outDir /app/ --emptyOutDir

FROM mcr.microsoft.com/dotnet/aspnet:9.0@sha256:7ccab69cb986ab83c359552c86e9cef2b2238e7c4b75a75a7b60a3e26c1bc3cd AS base
WORKDIR /app
COPY --from=build-dotnet /app .
COPY --from=build-node /app ./wwwroot
RUN mkdir /data

ENTRYPOINT ["dotnet", "Bottleneko.Server.dll", "--bind", "http://0.0.0.0:5000", "--db", "/data/bottleneko.db"]
EXPOSE 5000
