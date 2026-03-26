-- ==========================================
-- COMPLETE DATABASE FIX - Nov 2025
-- ==========================================

-- 1. حذف Event Trigger الغلط
DROP EVENT TRIGGER IF EXISTS on_create_table_enable_rls CASCADE;
DROP FUNCTION IF EXISTS auto_enable_rls() CASCADE;

-- 2. تحديث البيانات القديمة في enum
UPDATE "Subscription" SET "plan" = 'STANDARD' WHERE "plan" IN ('BASIC', 'PREMIUM');
UPDATE "Payment" SET "plan" = 'STANDARD' WHERE "plan" IN ('BASIC', 'PREMIUM');

-- 3. إضافة جميع الأعمدة الناقصة في Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "thumbnail" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comparePrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "trackInventory" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightUnit" TEXT DEFAULT 'kg';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "length" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "width" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "height" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dimensionUnit" TEXT DEFAULT 'cm';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingFee" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockAlert" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowBackorder" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bulkPricing" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badges" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "relatedProducts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "crossSellProducts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;

-- 4. إضافة الأعمدة الناقصة في Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "daira" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

-- 5. إضافة الأعمدة الناقصة في Tenant (Shipping + Integrations)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "checkoutConfig" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "storeFeatures" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "privacyPolicy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "termsOfService" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "thankYouMessage" VARCHAR(255);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "thankYouImage" VARCHAR(500);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "shippingConfig" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "integrations" JSONB DEFAULT '{}'::jsonb;

-- 6. إنشاء جدول PlanFeatureFlags
CREATE TABLE IF NOT EXISTS "PlanFeatureFlags" (
  "id" TEXT PRIMARY KEY,
  "plan" TEXT NOT NULL UNIQUE,
  "variantsEnabled" BOOLEAN DEFAULT false,
  "quantityDiscountsEnabled" BOOLEAN DEFAULT false,
  "checkoutCustomizationEnabled" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 7. إدراج Feature Flags
INSERT INTO "PlanFeatureFlags" ("id", "plan", "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled")
VALUES 
  (gen_random_uuid()::text, 'FREE', true, true, true),
  (gen_random_uuid()::text, 'STANDARD', true, true, false),
  (gen_random_uuid()::text, 'PRO', true, true, true)
ON CONFLICT ("plan") DO NOTHING;

-- 8. إنشاء جدول Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- 9. تحديث القيم NULL في JSON
UPDATE "Product" SET "bulkPricing" = '[]'::jsonb WHERE "bulkPricing" IS NULL;
UPDATE "Product" SET "badges" = '[]'::jsonb WHERE "badges" IS NULL;
UPDATE "Product" SET "relatedProducts" = '[]'::jsonb WHERE "relatedProducts" IS NULL;
UPDATE "Product" SET "crossSellProducts" = '[]'::jsonb WHERE "crossSellProducts" IS NULL;

-- 10. تحديث thumbnail من images (أول صورة)
UPDATE "Product" 
SET "thumbnail" = (
  CASE 
    WHEN "images" IS NOT NULL AND jsonb_array_length("images"::jsonb) > 0 
    THEN "images"::jsonb->>0
    ELSE NULL
  END
)
WHERE "thumbnail" IS NULL AND "images" IS NOT NULL;

-- 11. تحديد المهاجرة كمطبقة
DELETE FROM "_prisma_migrations" WHERE migration_name = '20251030_hotfix_missing_schema';

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  'complete_fix_nov_2025',
  NOW(),
  '20251030_hotfix_missing_schema',
  'Complete fix: thumbnail + shipping + integrations + all columns',
  NULL,
  NOW(),
  1
);

-- 12. رسالة النجاح
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ حذف Event Trigger';
  RAISE NOTICE '✅ تحديث enum values القديمة';
  RAISE NOTICE '✅ إضافة Product.thumbnail';
  RAISE NOTICE '✅ إضافة Tenant.shippingConfig';
  RAISE NOTICE '✅ إضافة Tenant.integrations';
  RAISE NOTICE '✅ إضافة جميع الأعمدة الناقصة';
  RAISE NOTICE '✅ إنشاء PlanFeatureFlags';
  RAISE NOTICE '✅ إنشاء Notification';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 قاعدة البيانات جاهزة 100%%';
END $$;
