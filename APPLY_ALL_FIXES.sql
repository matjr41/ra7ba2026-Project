-- ============================================
-- إصلاح شامل لجميع مشاكل قاعدة البيانات
-- ============================================

-- 1. إضافة أعمدة الأمان للجدول User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "createdIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- 2. إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS "User_createdIp_idx" ON "User"("createdIp");
CREATE INDEX IF NOT EXISTS "User_loginAttempts_idx" ON "User"("loginAttempts");
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx" ON "User"("lockedUntil");

-- 3. تحديث السجلات الموجودة
UPDATE "User" SET "createdIp" = 'legacy' WHERE "createdIp" IS NULL;
UPDATE "User" SET "loginAttempts" = 0 WHERE "loginAttempts" IS NULL;

-- 4. إصلاح عمود status في جدول Order
UPDATE "Order" SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

ALTER TABLE "Order" DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS status "OrderStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);

-- 5. إصلاح RefreshToken foreign key
ALTER TABLE "RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. No need for OrderItem table - items are stored as JSON in Order.items
-- The selectedOptions will be part of the items JSON structure

-- تم الانتهاء
