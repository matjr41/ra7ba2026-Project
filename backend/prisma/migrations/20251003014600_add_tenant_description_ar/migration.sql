-- Add descriptionAr column to Tenant
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
