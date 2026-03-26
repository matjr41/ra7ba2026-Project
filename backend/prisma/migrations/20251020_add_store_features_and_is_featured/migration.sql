-- Add missing Product and Tenant columns to match Prisma schema
-- Safe/idempotent: uses IF NOT EXISTS guards

-- Product: isFeatured flag
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;

-- Tenant: store features and policies + thank you page fields
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "storeFeatures" JSONB,
  ADD COLUMN IF NOT EXISTS "privacyPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "termsOfService" TEXT,
  ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "thankYouMessage" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "thankYouImage" VARCHAR(500);
