$platforms = 'win-x64', 'win-arm64', 'osx-x64', 'osx-arm64', 'linux-x64', 'linux-arm64'

Remove-Item ./publish -Recurse

foreach ($platform in $platforms) {
    Write-Host
    Write-Host 'Building for ' -NoNewline
    Write-Host $platform -ForegroundColor Green
    Write-Host
    & dotnet publish ./Bottleneko.Server -c Release -r $platform --self-contained -o ./publish/$platform
}

Push-Location ./Bottleneko.Client
try {
    & npm run build '--' --outDir ../publish/wwwroot --emptyOutDir
} finally {
    Pop-Location
}

foreach ($platform in $platforms) {
    Copy-Item ./publish/wwwroot ./publish/$platform/ -Recurse
}

Remove-Item ./publish/wwwroot -Recurse
