$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsDirectory = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Force -Path $toolsDirectory | Out-Null
$assets = Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'
$package = $assets[0].binary.package
$archive = Join-Path $toolsDirectory 'jdk21.zip'
Invoke-WebRequest -Uri $package.link -OutFile $archive -UseBasicParsing
$actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
if ($actualHash -ne $package.checksum) { throw 'JDK SHA256 checksum mismatch' }
Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $toolsDirectory 'java') -Force
Write-Host 'JDK 21 installed in .local/java. npm.cmd run dev selects it automatically.'
