# Download logo automatically
Write-Host "Downloading logo..." -ForegroundColor Cyan

# Create images folder if not exists
$imagesPath = "frontend\public\images"
if (-not (Test-Path $imagesPath)) {
    New-Item -ItemType Directory -Path $imagesPath -Force | Out-Null
    Write-Host "Created images folder: $imagesPath" -ForegroundColor Green
}

# Download logo
$logoUrl = "https://i.pinimg.com/originals/df/1f/72/df1f72a8b434e4a4b3a42d5b4f2adf2f.gif"
$logoPath = "$imagesPath\logo.gif"

try {
    Invoke-WebRequest -Uri $logoUrl -OutFile $logoPath -UseBasicParsing
    Write-Host "Logo downloaded successfully!" -ForegroundColor Green
    Write-Host "Saved to: $logoPath" -ForegroundColor Yellow
} catch {
    Write-Host "Failed to download logo. Please download manually." -ForegroundColor Red
    Write-Host "URL: $logoUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add the other two images manually to: $imagesPath" -ForegroundColor White
Write-Host "   - delivery-companies.png" -ForegroundColor White
Write-Host "   - integrate-platforms.png" -ForegroundColor White
Write-Host ""
Write-Host "2. Run the project:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Done!" -ForegroundColor Green

Read-Host "Press Enter to exit"
