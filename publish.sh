#!/bin/sh

dotnet run --file ./scripts/Publish.cs --no-cache -- "$@"
