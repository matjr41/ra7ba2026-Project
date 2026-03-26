const { PrismaClient } = require('@prisma/client');

async function fixMissingColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting to fix missing columns...');
    
    // Apply the migration SQL directly
    const migrationSQL = `
-- Add missing columns to fix database errors
-- Safe/idempotent migration - checks for column existence first

DO $$
BEGIN
    -- Add storeFeatures column to Tenant table if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'storeFeatures'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "storeFeatures" JSONB;
        RAISE NOTICE 'Added column Tenant.storeFeatures';
    END IF;

    -- Add isFeatured column to Product table if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column Product.isFeatured';
    END IF;

    -- Add other missing Product columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'weight'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "weight" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.weight';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'weightUnit'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "weightUnit" TEXT DEFAULT 'kg';
        RAISE NOTICE 'Added column Product.weightUnit';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'length'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "length" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.length';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'width'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "width" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.width';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'height'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "height" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.height';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'dimensionUnit'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "dimensionUnit" TEXT DEFAULT 'cm';
        RAISE NOTICE 'Added column Product.dimensionUnit';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'shippingFee'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "shippingFee" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.shippingFee';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'freeShipping'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "freeShipping" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column Product.freeShipping';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'lowStockAlert'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "lowStockAlert" INTEGER;
        RAISE NOTICE 'Added column Product.lowStockAlert';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'allowBackorder'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "allowBackorder" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column Product.allowBackorder';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'bulkPricing'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "bulkPricing" JSONB DEFAULT '[]';
        RAISE NOTICE 'Added column Product.bulkPricing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'badges'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "badges" JSONB DEFAULT '[]';
        RAISE NOTICE 'Added column Product.badges';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'relatedProducts'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "relatedProducts" JSONB DEFAULT '[]';
        RAISE NOTICE 'Added column Product.relatedProducts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'crossSellProducts'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "crossSellProducts" JSONB DEFAULT '[]';
        RAISE NOTICE 'Added column Product.crossSellProducts';
    END IF;

    -- Add missing Tenant columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'telegramChatId'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "telegramChatId" TEXT;
        RAISE NOTICE 'Added column Tenant.telegramChatId';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'thankYouMessage'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "thankYouMessage" TEXT;
        RAISE NOTICE 'Added column Tenant.thankYouMessage';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'thankYouImage'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "thankYouImage" TEXT;
        RAISE NOTICE 'Added column Tenant.thankYouImage';
    END IF;

END $$;
    `;
    
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Missing columns migration completed successfully!');
    
    // Test the fix by running a simple query
    const tenantCount = await prisma.tenant.count();
    const productCount = await prisma.product.count();
    console.log('✅ Database is working correctly. Total tenants: ' + tenantCount + ', Total products: ' + productCount);
    
  } catch (error) {
    console.error('❌ Error fixing missing columns:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixMissingColumns();
}

module.exports = { fixMissingColumns };
