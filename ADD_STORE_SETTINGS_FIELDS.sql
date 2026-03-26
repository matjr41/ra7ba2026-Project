-- Migration: Add Store Settings Fields to Tenant
-- Date: 2025-10-19
-- Description: Add storeFeatures, policies, and thank you page fields

-- Add new fields to Tenant table
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "storeFeatures" JSONB,
ADD COLUMN IF NOT EXISTS "privacyPolicy" TEXT,
ADD COLUMN IF NOT EXISTS "termsOfService" TEXT,
ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT,
ADD COLUMN IF NOT EXISTS "thankYouMessage" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "thankYouImage" VARCHAR(500);

-- Add comments for documentation
COMMENT ON COLUMN "Tenant"."storeFeatures" IS 'Store features configuration (free shipping, warranty, etc.)';
COMMENT ON COLUMN "Tenant"."privacyPolicy" IS 'Store privacy policy text';
COMMENT ON COLUMN "Tenant"."termsOfService" IS 'Store terms of service text';
COMMENT ON COLUMN "Tenant"."returnPolicy" IS 'Store return policy text';
COMMENT ON COLUMN "Tenant"."thankYouMessage" IS 'Custom thank you message after order';
COMMENT ON COLUMN "Tenant"."thankYouImage" IS 'Thank you page image URL';
