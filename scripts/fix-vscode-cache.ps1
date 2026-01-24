# Script to fix VS Code TypeScript cache issues
# Run this if you see "Cannot find module" errors that don't make sense

Write-Host "Fixing VS Code TypeScript Cache..." -ForegroundColor Cyan
Write-Host ""

# Delete TypeScript cache
if (Test-Path ".vscode/.tsbuildinfo") {
    Remove-Item ".vscode/.tsbuildinfo" -Force
    Write-Host "Deleted .tsbuildinfo" -ForegroundColor Green
}

# Touch tsconfig to trigger reload
if (Test-Path "tsconfig.json") {
    (Get-Item "tsconfig.json").LastWriteTime = Get-Date
    Write-Host "Touched tsconfig.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. In VS Code, press: Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "   2. Type: TypeScript: Restart TS Server" -ForegroundColor Gray
Write-Host "   3. Press Enter" -ForegroundColor Gray
Write-Host ""
Write-Host "   OR simply reload VS Code window:" -ForegroundColor Gray
Write-Host "   Ctrl+Shift+P -> Developer: Reload Window" -ForegroundColor Gray
Write-Host ""
Write-Host "Done! Error should disappear after reload." -ForegroundColor Green
