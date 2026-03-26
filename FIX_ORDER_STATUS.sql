-- إصلاح عمود status في جدول Order
-- المشكلة: العمود TEXT بدلاً من OrderStatus enum

-- 1. تحويل القيم الموجودة للـ enum الصحيح
UPDATE "Order" SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- 2. حذف العمود القديم وإنشاء الجديد
ALTER TABLE "Order" DROP COLUMN IF EXISTS status;
ALTER TABLE "Order" ADD COLUMN status "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- 3. إنشاء index
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);

-- 4. إصلاح RefreshToken cascade
ALTER TABLE "RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
