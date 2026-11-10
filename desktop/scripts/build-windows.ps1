$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $root
$icon = Join-Path $root 'app\assets\cocoloop.ico'

Write-Host 'Installing PyInstaller...'
py -m pip install --user --upgrade pyinstaller
if ($LASTEXITCODE -ne 0) { exit 1 }

New-Item -ItemType Directory -Force desktop\resources\server | Out-Null
New-Item -ItemType Directory -Force .build\server | Out-Null
New-Item -ItemType Directory -Force .build\mcp | Out-Null
New-Item -ItemType Directory -Force .build\cli | Out-Null

Write-Host 'Building sidecar executables...'
py -m PyInstaller --noconfirm --clean --onefile --name cocoloop-server --icon $icon --distpath desktop\resources\server --workpath .build\server --specpath .build server.py
if ($LASTEXITCODE -ne 0) { exit 1 }
py -m PyInstaller --noconfirm --clean --onefile --name cocoloop-mcp --icon $icon --paths bridge --distpath desktop\resources\server --workpath .build\mcp --specpath .build bridge\mcp_server.py
if ($LASTEXITCODE -ne 0) { exit 1 }
py -m PyInstaller --noconfirm --clean --onefile --name cocoloop-cli --icon $icon --paths bridge --distpath desktop\resources\server --workpath .build\cli --specpath .build bridge\clctl.py
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host 'Building installer...'
Set-Location (Join-Path $root 'desktop')
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { exit 1 }
npm run dist
if ($LASTEXITCODE -ne 0) { exit 1 }

Get-ChildItem dist | Format-Table Name,Length
Write-Host 'DESKTOP_BUILD_OK'
