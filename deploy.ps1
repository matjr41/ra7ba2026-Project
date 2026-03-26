# Deploy Script for Ra7ba Project

# Set environment variables
$env:RAILWAY_TOKEN = "c8c9426f-769a-4c3c-b1dc-ce4025e79209"
$env:VERCEL_TOKEN = "44IczRpdTYkiy2rU7RdxKoyY"

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Deploy Backend to Railway
Write-Host "`n📦 Deploying Backend to Railway..." -ForegroundColor Yellow
Set-Location -Path ".\backend"

# Configure Railway
railway login --token $env:RAILWAY_TOKEN
railway link matjr
railway up --detach

Write-Host "✅ Backend deployed to Railway!" -ForegroundColor Green

# Deploy Frontend to Vercel
Write-Host "`n📦 Deploying Frontend to Vercel..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"

# Configure Vercel
vercel --token $env:VERCEL_TOKEN --prod --yes

Write-Host "✅ Frontend deployed to Vercel!" -ForegroundColor Green
Write-Host "`n🎉 Deployment complete!" -ForegroundColor Magenta

Set-Location -Path ".."
