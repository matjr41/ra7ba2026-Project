#!/bin/bash

# 🚀 Rahba SaaS Setup Script
# هذا السكريبت يساعد في إعداد المشروع بسرعة

echo "🎉 مرحباً بك في إعداد منصة رحبة!"
echo "====================================="

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js 20+ من nodejs.org"
    exit 1
fi

echo "✅ Node.js موجود: $(node --version)"

# التحقق من PostgreSQL
if ! command -v psql &> /dev/null && ! command -v pg_isready &> /dev/null; then
    echo "❌ PostgreSQL غير مثبت."
    echo "💡 للتثبيت:"
    echo "   - Windows: حمل من postgresql.org"
    echo "   - macOS: brew install postgresql"
    echo "   - Linux: sudo apt install postgresql"
    exit 1
fi

echo "✅ PostgreSQL موجود"

# إعداد Backend
echo ""
echo "🔧 إعداد الخادم الخلفي..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 إنشاء ملف .env..."
    cp .env.example .env
    echo "✅ تم إنشاء .env - يرجى تعديل البيانات فيه"
fi

echo "📦 تثبيت التبعيات..."
npm install

echo "🔄 توليد Prisma Client..."
npx prisma generate

echo "🗄️ تطبيق migrations..."
npx prisma migrate dev

echo "🌱 ملء البيانات الأولية..."
npx prisma db seed

echo "🚀 تشغيل الخادم..."
npm run start:dev &
BACKEND_PID=$!

echo "✅ Backend يعمل على http://localhost:10000"
cd ..

# إعداد Frontend
echo ""
echo "🎨 إعداد الواجهة الأمامية..."
cd frontend

if [ ! -f ".env.local" ]; then
    echo "📝 إنشاء ملف .env.local..."
    cp .env.example .env.local
    echo "✅ تم إنشاء .env.local - يرجى تعديل البيانات فيه"
fi

echo "📦 تثبيت التبعيات..."
npm install

echo "🎭 تشغيل التطوير..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend يعمل على http://localhost:3000"

echo ""
echo "🎊 تم إعداد المشروع بنجاح!"
echo "================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:10000/api"
echo "📚 API Docs: http://localhost:10000/api/docs"
echo ""
echo "💡 لإيقاف الخدمات: pkill -f 'nest start' && pkill -f 'next dev'"
echo ""
echo "📖 للمزيد من التفاصيل:"
echo "   - frontend/FRONTEND_SETUP.md"
echo "   - backend/BACKEND_SETUP.md"
echo "   - README.md"
