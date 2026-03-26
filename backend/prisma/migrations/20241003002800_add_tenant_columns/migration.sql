-- Add missing columns to Tenant to match schema.prisma
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "nameAr" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT,
  ADD COLUMN IF NOT EXISTS "banner" TEXT,
  ADD COLUMN IF NOT EXISTS "theme" JSONB,
  ADD COLUMN IF NOT EXISTS "orderCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "productCount" INTEGER NOT NULL DEFAULT 0;

-- Unique index for customDomain (nullable unique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Tenant_customDomain_key'
  ) THEN
    CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");
  END IF;
END $$;

-- Ensure ownerId is unique (matches schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Tenant_ownerId_key'
  ) THEN
    CREATE UNIQUE INDEX "Tenant_ownerId_key" ON "Tenant"("ownerId");
  END IF;
END $$;
