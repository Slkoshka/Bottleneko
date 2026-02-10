# syntax=docker/dockerfile:1.7-labs

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG VERSION_SUFFIX="-local"

WORKDIR /build

# Install dependencies
ARG DEBIAN_FRONTEND=noninteractive
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install 25"

# Restore
COPY --parents ./**/*.slnx ./
COPY --parents ./**/*.csproj ./
COPY --parents ./**/*.esproj ./
COPY --parents ./**/*.props ./
RUN dotnet restore

# Publish
COPY . .
RUN bash -c "source $NVM_DIR/nvm.sh && dotnet run --file ./scripts/Publish.cs --no-cache -- --tag ${VERSION_SUFFIX} --platform current --output /app"

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
COPY --from=build /app .
RUN mkdir /data

ENTRYPOINT ["dotnet", "Bottleneko.Server.dll", "--bind", "http://0.0.0.0:5000", "--data", "/data"]
EXPOSE 5000
