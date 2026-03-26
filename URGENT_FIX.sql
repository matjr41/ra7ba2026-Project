-- 🚨 URGENT FIX FOR PRODUCTION DATABASE
-- Copy this entire script and run it in Supabase SQL Editor NOW!
-- ============================================================

-- Step 1: Add missing Product columns (CRITICAL!)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comparePrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "trackInventory" BOOLEAN DEFAULT false;

-- Step 2: Add SEO field
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;

-- Step 3: Add shipping and dimensions
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightUnit" TEXT DEFAULT 'kg';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "length" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "width" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "height" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dimensionUnit" TEXT DEFAULT 'cm';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingFee" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN DEFAULT false;

-- Step 4: Add stock management
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockAlert" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowBackorder" BOOLEAN DEFAULT false;

-- Step 5: Add JSON fields for advanced features
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bulkPricing" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badges" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "relatedProducts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "crossSellProducts" JSONB DEFAULT '[]'::jsonb;

-- Step 6: Add Tenant checkout config
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "checkoutConfig" JSONB;

-- Step 7: Fix existing NULL JSON values (with proper JSONB casting)
-- NOTE: Skip "images" - it's already text[] type, not jsonb
UPDATE "Product" SET "bulkPricing" = '[]'::jsonb WHERE "bulkPricing" IS NULL;
UPDATE "Product" SET "badges" = '[]'::jsonb WHERE "badges" IS NULL;
UPDATE "Product" SET "relatedProducts" = '[]'::jsonb WHERE "relatedProducts" IS NULL;
UPDATE "Product" SET "crossSellProducts" = '[]'::jsonb WHERE "crossSellProducts" IS NULL;

-- Step 8: Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('comparePrice', 'stock', 'cost', 'trackInventory', 'seoKeywords', 'weight', 'shippingFee')
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration completed! Database is now up to date.';
  RAISE NOTICE '🎉 All Product columns added successfully!';
END $$;
