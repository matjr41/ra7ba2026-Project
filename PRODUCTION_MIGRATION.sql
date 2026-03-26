-- ==========================================
-- PRODUCTION MIGRATION SCRIPT
-- تطبيق هذا Script على قاعدة بيانات Production
-- لإضافة جميع الأعمدة والجداول الناقصة
-- ==========================================

-- ==============================================
-- PART 1: ADD ENUM VALUES (يجب تشغيله أولاً)
-- ==============================================

-- Add FREE to SubscriptionPlan
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'FREE'
  ) THEN
    ALTER TYPE "SubscriptionPlan" ADD VALUE 'FREE';
  END IF;
END $$;

-- Add STANDARD to SubscriptionPlan
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'STANDARD'
  ) THEN
    ALTER TYPE "SubscriptionPlan" ADD VALUE 'STANDARD';
  END IF;
END $$;

-- Add PRO to SubscriptionPlan
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'PRO'
  ) THEN
    ALTER TYPE "SubscriptionPlan" ADD VALUE 'PRO';
  END IF;
END $$;

-- Add YALIDINE to DeliveryCompany
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'DeliveryCompany' AND e.enumlabel = 'YALIDINE'
  ) THEN
    ALTER TYPE "DeliveryCompany" ADD VALUE 'YALIDINE';
  END IF;
END $$;

-- Add ZR_EXPRESS to DeliveryCompany
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'DeliveryCompany' AND e.enumlabel = 'ZR_EXPRESS'
  ) THEN
    ALTER TYPE "DeliveryCompany" ADD VALUE 'ZR_EXPRESS';
  END IF;
END $$;

-- Add JET_EXPRESS to DeliveryCompany
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'DeliveryCompany' AND e.enumlabel = 'JET_EXPRESS'
  ) THEN
    ALTER TYPE "DeliveryCompany" ADD VALUE 'JET_EXPRESS';
  END IF;
END $$;

-- ==============================================
-- PART 2: ADD MISSING COLUMNS TO PRODUCT
-- ==============================================

-- Essential columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comparePrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "trackInventory" BOOLEAN DEFAULT false;
-- Featured flag
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;

-- SEO fields
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;

-- Shipping and dimensions
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightUnit" TEXT DEFAULT 'kg';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "length" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "width" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "height" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dimensionUnit" TEXT DEFAULT 'cm';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingFee" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN DEFAULT false;

-- Stock management
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockAlert" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowBackorder" BOOLEAN DEFAULT false;

-- JSON fields
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bulkPricing" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badges" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "relatedProducts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "crossSellProducts" JSONB DEFAULT '[]'::jsonb;

-- ==============================================
-- PART 3: ADD MISSING COLUMNS TO TENANT
-- ==============================================

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "checkoutConfig" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "storeFeatures" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "privacyPolicy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "termsOfService" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "thankYouMessage" VARCHAR(255);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "thankYouImage" VARCHAR(500);

-- ==============================================
-- PART 4: CREATE NOTIFICATION TABLE
-- ==============================================

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

-- ==============================================
-- PART 5: CREATE PLANFEATUREFLAGS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS "PlanFeatureFlags" (
  "id" TEXT PRIMARY KEY,
  "plan" "SubscriptionPlan" NOT NULL UNIQUE,
  "variantsEnabled" BOOLEAN DEFAULT false,
  "quantityDiscountsEnabled" BOOLEAN DEFAULT false,
  "checkoutCustomizationEnabled" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Insert default feature flags
INSERT INTO "PlanFeatureFlags" ("id", "plan", "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled")
VALUES 
  (gen_random_uuid(), 'FREE', true, true, true),
  (gen_random_uuid(), 'STANDARD', true, true, false),
  (gen_random_uuid(), 'PRO', true, true, true)
ON CONFLICT ("plan") DO NOTHING;

-- ==============================================
-- PART 6: ADD UNIQUE CONSTRAINT TO SETTING.KEY
-- ==============================================

CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

-- ==============================================
-- PART 7: ENSURE JSON FIELDS HAVE DEFAULTS
-- ==============================================

UPDATE "Product" SET "bulkPricing" = '[]'::jsonb WHERE "bulkPricing" IS NULL OR "bulkPricing"::text = 'null';
UPDATE "Product" SET "badges" = '[]'::jsonb WHERE "badges" IS NULL OR "badges"::text = 'null';
UPDATE "Product" SET "relatedProducts" = '[]'::jsonb WHERE "relatedProducts" IS NULL OR "relatedProducts"::text = 'null';
UPDATE "Product" SET "crossSellProducts" = '[]'::jsonb WHERE "crossSellProducts" IS NULL OR "crossSellProducts"::text = 'null';

-- ==============================================
-- PART 8: UPDATE OLD DATA (OPTIONAL)
-- ==============================================

-- Update old enum values to new ones
UPDATE "Subscription" SET "plan" = 'FREE' WHERE "plan"::text IN ('BASIC', 'PREMIUM');
UPDATE "Payment" SET "plan" = 'FREE' WHERE "plan"::text IN ('BASIC', 'PREMIUM');

-- Update Order delivery company
UPDATE "Order" SET "deliveryCompany" = 'YALIDINE' WHERE "deliveryCompany"::text = 'ECOLOG';

-- ==============================================
-- ✅ MIGRATION COMPLETE!
-- ==============================================

-- Verify Product columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
ORDER BY ordinal_position;

-- Verify Notification table
SELECT COUNT(*) as notification_table_exists FROM information_schema.tables WHERE table_name = 'Notification';

-- Verify PlanFeatureFlags table
SELECT * FROM "PlanFeatureFlags";

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ Product table updated with new columns';
  RAISE NOTICE '✅ Notification table created';
  RAISE NOTICE '✅ PlanFeatureFlags table created';
  RAISE NOTICE '✅ All enum values added';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database is now in sync with Prisma Schema!';
END $$;
