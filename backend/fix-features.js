const { PrismaClient } = require('@prisma/client');

async function fixFeatures() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting feature schema fix (variants, bundles, flags, checkoutConfig)...');
    // Detect Product.id column type to align foreign keys (uuid or text)
    const prodTypeRow = await prisma.$queryRawUnsafe(
      `SELECT format_type(a.atttypid, a.atttypmod) AS col_type
       FROM pg_attribute a
       JOIN pg_class c ON a.attrelid = c.oid
       JOIN pg_namespace n ON c.relnamespace = n.oid
       WHERE n.nspname = 'public' AND c.relname = 'Product' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped
       LIMIT 1;`
    );
    let productIdType = 'TEXT';
    if (Array.isArray(prodTypeRow) && prodTypeRow[0] && prodTypeRow[0].col_type) {
      const t = String(prodTypeRow[0].col_type).toLowerCase();
      if (t.includes('uuid')) productIdType = 'UUID';
      else if (t.includes('text')) productIdType = 'TEXT';
      else if (t.includes('character varying') || t.includes('varchar')) productIdType = 'TEXT';
    }
    console.log('Detected Product.id type:', productIdType);

    const doBlock = `
DO $$
BEGIN
    -- Ensure required extensions for UUID generation
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1) Tenant.checkoutConfig JSON column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'checkoutConfig'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "checkoutConfig" JSONB;
        RAISE NOTICE 'Added column Tenant.checkoutConfig';
    END IF;

    -- 2) ProductOption table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductOption'
    ) THEN
        CREATE TABLE "ProductOption" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            name TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductOption';
    END IF;

    -- 3) ProductOptionValue table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductOptionValue'
    ) THEN
        CREATE TABLE "ProductOptionValue" (
            id TEXT PRIMARY KEY,
            "optionId" TEXT NOT NULL,
            value TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductOptionValue';
    END IF;

    -- 4) ProductVariant table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductVariant'
    ) THEN
        CREATE TABLE "ProductVariant" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            sku TEXT,
            barcode TEXT,
            price DECIMAL(10,2),
            stock INT,
            "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
            options JSONB NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductVariant';
    END IF;

    -- 5) BundleOffer table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BundleOffer'
    ) THEN
        CREATE TABLE "BundleOffer" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            "minQuantity" INT NOT NULL,
            "bundlePrice" DECIMAL(10,2) NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table BundleOffer';
    END IF;

    -- 6) PlanFeatureFlags table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'PlanFeatureFlags'
    ) THEN
        CREATE TABLE "PlanFeatureFlags" (
            id TEXT PRIMARY KEY,
            plan "SubscriptionPlan" NOT NULL UNIQUE,
            "variantsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "quantityDiscountsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "checkoutCustomizationEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table PlanFeatureFlags';
    END IF;

    -- 7) FKs and Indexes (create if missing)
    -- ProductOption.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductOption_productId_fkey'
    ) THEN
        ALTER TABLE "ProductOption"
            ADD CONSTRAINT "ProductOption_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- ProductOptionValue.optionId -> ProductOption.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductOptionValue_optionId_fkey'
    ) THEN
        ALTER TABLE "ProductOptionValue"
            ADD CONSTRAINT "ProductOptionValue_optionId_fkey"
            FOREIGN KEY ("optionId") REFERENCES "ProductOption"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- ProductVariant.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
    ) THEN
        ALTER TABLE "ProductVariant"
            ADD CONSTRAINT "ProductVariant_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- BundleOffer.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BundleOffer_productId_fkey'
    ) THEN
        ALTER TABLE "BundleOffer"
            ADD CONSTRAINT "BundleOffer_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- indexes
    CREATE INDEX IF NOT EXISTS "ProductOption_productId_idx" ON "ProductOption"("productId");
    CREATE INDEX IF NOT EXISTS "ProductOptionValue_optionId_idx" ON "ProductOptionValue"("optionId");
    CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
    CREATE INDEX IF NOT EXISTS "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");
    CREATE INDEX IF NOT EXISTS "BundleOffer_productId_idx" ON "BundleOffer"("productId");
    CREATE INDEX IF NOT EXISTS "BundleOffer_isActive_idx" ON "BundleOffer"("isActive");

END $$;`;

    await prisma.$executeRawUnsafe(doBlock);

    const seedStd = `INSERT INTO "PlanFeatureFlags" (id, plan, "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled")
SELECT gen_random_uuid(), 'STANDARD', FALSE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM "PlanFeatureFlags" WHERE plan = 'STANDARD');`;
    await prisma.$executeRawUnsafe(seedStd);

    const seedPro = `INSERT INTO "PlanFeatureFlags" (id, plan, "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled")
SELECT gen_random_uuid(), 'PRO', TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM "PlanFeatureFlags" WHERE plan = 'PRO');`;
    await prisma.$executeRawUnsafe(seedPro);
    console.log('✅ Feature schema fix applied successfully');
  } catch (error) {
    console.error('❌ Error applying feature schema fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixFeatures();
}

module.exports = { fixFeatures };
