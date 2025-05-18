Remove-Item ./Bottleneko.Core/Scripting/Js/API -Recurse
Remove-Item ./Bottleneko.Client/src/features/scripts/api/ -Recurse
Remove-Item ./Bottleneko.ScriptAPI/dist -Recurse

New-Item ./Bottleneko.Core/Scripting/Js/API -ItemType Directory
New-Item ./Bottleneko.Client/src/features/scripts/api -ItemType Directory

Push-Location Bottleneko.CodeGenerator
try {
    & dotnet run '--' ../Bottleneko.Client/src/features/api/dtos.gen.ts ../Bottleneko.Client/src/features/scripts/api/bottleneko.gen.d.ts
} finally {
    Pop-Location
}

Push-Location Bottleneko.ScriptAPI
try {
    Copy-Item ../Bottleneko.Client/src/features/scripts/api/bottleneko.gen.d.ts ./src/typeDefs
    
    & npm install
    & npm run build '--' --declaration --outDir ./dist

    & robocopy ./src/typeDefs/ ./dist/ *.d.ts /s

    & robocopy ./dist/ ../Bottleneko.Core/Scripting/Js/API/ *.js /s
    & robocopy ./dist/ ../Bottleneko.Client/src/features/scripts/api/ *.ts /s /xf _*.*

    $Files = Get-ChildItem -Path ../Bottleneko.Client/src/features/scripts/api/* -Filter *.d.ts -Recurse | Where-Object { !$_.PSisContainer }
    $Base = Resolve-Path '../Bottleneko.Client/src/features/scripts/api/'
    $TypeDefsImports = for ($i = 0; $i -lt $Files.Length; $i++) {
        $Directory = [System.IO.Path]::GetDirectoryName($Files[$i].FullName)
        $FileNameNoExtension = [System.IO.Path]::GetFileNameWithoutExtension($Files[$i].FullName)
        $RelativePath = [System.IO.Path]::GetRelativePath($Base, [System.IO.Path]::Join($Directory, $FileNameNoExtension)).Replace('\', '/')
        "import typeDef$i from './$RelativePath`?raw';"
    }
    $TypeDefsExports = for ($i = 0; $i -lt $Files.Length; $i++) {
        $RelativePath = [System.IO.Path]::GetRelativePath($Base, $Files[$i].FullName).Replace('\', '/')
        "    { src: typeDef$i, path: '$RelativePath' },"
    }
    "/* eslint-disable import/default */`n$($TypeDefsImports -join "`n")`n`nexport default [`n$($TypeDefsExports -join "`n")`n];" | Out-File -FilePath '../Bottleneko.Client/src/features/scripts/api/typeDefs.ts'    
} finally {
    Pop-Location
}
