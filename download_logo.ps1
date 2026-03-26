# تحميل صورة اللوجو تلقائياً

Write-Host "🚀 جاري تحميل صورة اللوجو..." -ForegroundColor Cyan

# إنشاء المجلد إذا لم يكن موجوداً
$imagesPath = "frontend\public\images"
if (-not (Test-Path $imagesPath)) {
    New-Item -ItemType Directory -Path $imagesPath -Force | Out-Null
    Write-Host "✅ تم إنشاء مجلد الصور: $imagesPath" -ForegroundColor Green
}

# رابط صورة اللوجو
$logoUrl = "https://i.pinimg.com/originals/df/1f/72/df1f72a8b434e4a4b3a42d5b4f2adf2f.gif"
$logoPath = "$imagesPath\logo.gif"

try {
    # تحميل الصورة
    Invoke-WebRequest -Uri $logoUrl -OutFile $logoPath -UseBasicParsing
    Write-Host "✅ تم تحميل صورة اللوجو بنجاح!" -ForegroundColor Green
    Write-Host "📁 الصورة محفوظة في: $logoPath" -ForegroundColor Yellow
} catch {
    Write-Host "❌ فشل تحميل الصورة. الرجاء تحميلها يدوياً." -ForegroundColor Red
    Write-Host "   الرابط: $logoUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "1. أضف الصورتين الأخريين يدوياً إلى المجلد: $imagesPath" -ForegroundColor White
Write-Host "   - delivery-companies.png" -ForegroundColor White
Write-Host "   - integrate-platforms.png" -ForegroundColor White
Write-Host ""
Write-Host "2. شغل المشروع:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ بالتوفيق!" -ForegroundColor Green

Read-Host "اضغط Enter للخروج"
