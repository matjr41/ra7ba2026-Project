#!/bin/bash

# 🚨 Railway Debugging Script
# سكريبت لتشخيص وحل مشاكل Railway

echo "🔍 تشخيص مشاكل Railway..."
echo "=========================="

# التحقق من متغيرات البيئة
echo ""
echo "📋 فحص متغيرات البيئة في Railway Dashboard:"
echo "1. اذهب إلى: https://railway.app/project/YOUR_PROJECT"
echo "2. انقر على كل service (frontend و backend)"
echo "3. اذهب إلى 'Variables'"
echo "4. تأكد من وجود هذه المتغيرات في backend:"
echo ""
echo "   متغير                    | القيمة المطلوبة"
echo "   -------------------------|------------------"
echo "   NODE_ENV                 | production"
echo "   PORT                     | 10000"
echo "   HOSTNAME                 | 0.0.0.0"
echo "   DATABASE_URL             | من Railway PostgreSQL"
echo "   DIRECT_URL               | من Railway PostgreSQL"
echo "   JWT_SECRET               | مفتاح قوي (32 حرف+)"
echo "   JWT_REFRESH_SECRET       | مفتاح قوي مختلف"
echo "   CLERK_PUBLISHABLE_KEY    | من Clerk Dashboard"
echo "   CLERK_SECRET_KEY         | من Clerk Dashboard"
echo ""

# فحص الـ URL
echo "🔗 فحص الـ URLs:"
echo ""
echo "1. احصل على backend URL من Railway:"
echo "   مثال: https://your-backend.railway.app"
echo ""
echo "2. احصل على frontend URL من Railway:"
echo "   مثال: https://your-frontend.railway.app"
echo ""

# اختبار الـ endpoints
echo "🧪 اختبار الـ Endpoints:"
echo ""
echo "افتح المتصفح وجرب:"
echo ""
echo "1. API Health Check:"
echo "   https://your-backend.railway.app/api"
echo ""
echo "2. تسجيل الدخول:"
echo "   POST https://your-backend.railway.app/api/auth/login"
echo "   Body: {\"email\":\"admin@rahba.com\",\"password\":\"password\"}"
echo ""
echo "3. Frontend:"
echo "   https://your-frontend.railway.app"
echo ""

# حلول شائعة
echo "🔧 حلول المشاكل الشائعة:"
echo ""
echo "❌ إذا رأيت 'Connection refused' أو 'ECONNREFUSED':"
echo "   - تأكد من أن backend service يعمل في Railway"
echo "   - تحقق من متغير PORT=10000"
echo "   - أعد نشر الـ backend service"
echo ""
echo "❌ إذا رأيت أخطاء في قاعدة البيانات:"
echo "   - تأكد من أن PostgreSQL service متصل"
echo "   - تحقق من DATABASE_URL و DIRECT_URL"
echo "   - أعد نشر الـ backend بعد تحديث المتغيرات"
echo ""
echo "❌ إذا رأيت أخطاء CORS:"
echo "   - في backend، أضف frontend URL إلى CORS origins"
echo "   - أعد نشر الـ backend"
echo ""
echo "❌ إذا رأيت 'Module not found' في frontend:"
echo "   - تأكد من أن جميع المتغيرات موجودة في frontend service"
echo "   - أعد نشر الـ frontend"
echo ""

# خطوات النشر
echo "🚀 خطوات النشر الصحيحة:"
echo ""
echo "1. في Railway Dashboard:"
echo "   - أضف متغيرات البيئة في كل service"
echo "   - انقر على 'Deploy' في كل service"
echo "   - انتظر حتى ينتهي النشر (شاهد logs)"
echo ""
echo "2. التحقق من النجاح:"
echo "   - backend: https://your-backend.railway.app/api"
echo "   - frontend: https://your-frontend.railway.app"
echo ""
echo "3. إذا فشل النشر:"
echo "   - اقرأ logs في Railway dashboard"
echo "   - تحقق من الأخطاء في terminal"
echo "   - تأكد من متغيرات البيئة الصحيحة"
echo ""

echo "📞 للمساعدة:"
echo "- تحقق من logs في Railway dashboard"
echo "- اقرأ RAILWAY_FIX.md في المشروع"
echo "- جرب إعادة نشر الخدمات"
echo ""
echo "✅ جاري تشخيص مشكلة تسجيل الدخول..."
echo "افتح https://railway.app/project/YOUR_PROJECT للمتابعة"
