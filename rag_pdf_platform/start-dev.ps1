# Starts API (8765) and Vite in two new PowerShell windows. Leave both open while you use the app.
$PlatformRoot = $PSScriptRoot
$RepoRoot = Split-Path $PlatformRoot -Parent
$VenvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$Backend = Join-Path $PlatformRoot "backend"
$Frontend = Join-Path $PlatformRoot "frontend"

if (Test-Path $VenvPython) {
    $uvicornCmd = "& '$VenvPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8765"
} else {
    $uvicornCmd = "python -m uvicorn app.main:app --host 127.0.0.1 --port 8765"
}

Write-Host "DocLensAI — API http://127.0.0.1:8765  |  UI http://localhost:5173" -ForegroundColor Cyan
Write-Host "If Vite says port is in use, close other dev servers or: Get-Process node | Stop-Process" -ForegroundColor Yellow

Start-Process powershell -WorkingDirectory $Backend -ArgumentList @(
    "-NoExit", "-Command",
    "Write-Host 'DocLensAI API — leave this window open' -ForegroundColor Green; $uvicornCmd"
)

Start-Sleep -Seconds 2

Start-Process powershell -WorkingDirectory $Frontend -ArgumentList @(
    "-NoExit", "-Command",
    "Write-Host 'DocLensAI UI — leave this window open' -ForegroundColor Green; npm run dev"
)
