-- إضافة أعمدة الأمان للجدول User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "createdIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS "User_createdIp_idx" ON "User"("createdIp");
CREATE INDEX IF NOT EXISTS "User_loginAttempts_idx" ON "User"("loginAttempts");
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx" ON "User"("lockedUntil");

-- تحديث السجلات الموجودة
UPDATE "User" SET "createdIp" = 'legacy' WHERE "createdIp" IS NULL;
UPDATE "User" SET "loginAttempts" = 0 WHERE "loginAttempts" IS NULL;
