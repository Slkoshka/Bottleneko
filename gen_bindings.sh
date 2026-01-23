#!/bin/sh

dotnet run --file ./scripts/GenerateBindings.cs --no-cache "$@"
