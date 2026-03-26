-- Add missing stock column to Product table
-- This fixes the Prisma error: "The column Product.stock does not exist"

DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'stock'
    ) THEN
        ALTER TABLE "Product" 
        ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added stock column to Product table';
    ELSE
        RAISE NOTICE 'stock column already exists in Product table';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "idx_product_stock" ON "Product"("stock");

-- Update existing products to have default stock if needed
UPDATE "Product" 
SET "stock" = 0 
WHERE "stock" IS NULL OR "stock" < 0;

RAISE NOTICE '✅ Stock column fix completed successfully';
