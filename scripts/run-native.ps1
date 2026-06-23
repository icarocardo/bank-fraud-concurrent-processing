param(
  [int]$Workers = 12
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$dotnet = 'C:\Program Files\dotnet\dotnet.exe'
$dll = Join-Path $repo 'native\AntifraudeFast\bin\Release\net8.0\AntifraudeFast.dll'
$input = Join-Path $repo 'data\LI-Large_Trans.csv'

if (-not (Test-Path $dotnet)) {
  throw "dotnet.exe nao encontrado em $dotnet"
}

if (-not (Test-Path $dll)) {
  throw "Executavel nativo nao encontrado. Rode: npm run native:build"
}

& $dotnet $dll $Workers $input
