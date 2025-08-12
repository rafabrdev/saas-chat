# PowerShell script to cleanly restart development servers

Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting development servers..." -ForegroundColor Green
pnpm dev
