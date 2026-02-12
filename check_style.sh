#!/bin/sh

pushd ./src/Bottleneko.Client
npm run lint
npm run format
popd

dotnet format style --severity info --verify-no-changes --exclude ./External ./src/Bottleneko.Database/Migrations ./src/Bottleneko.Client
