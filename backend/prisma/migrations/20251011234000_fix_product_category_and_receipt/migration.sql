-- Ensure Product.categoryId exists with proper FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Product'
      AND table_schema = 'public'
      AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
  END IF;
END $$;

-- Add foreign key constraint if missing
DO $$
BEGIN
  IF to_regclass('public."Category"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'Product'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'categoryId'
    ) THEN
      ALTER TABLE "Product"
        ADD CONSTRAINT "Product_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "Category"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping Product.categoryId foreign key because Category table does not exist.';
  END IF;
END $$;

-- Add index for categoryId if missing
DO $$
BEGIN
  IF to_regclass('public."Category"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'Product_categoryId_idx'
    ) THEN
      CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
    END IF;
  END IF;
END $$;

-- Allow Payment.receiptImage to be nullable if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Payment'
      AND column_name = 'receiptImage'
  ) THEN
    ALTER TABLE "Payment" ALTER COLUMN "receiptImage" DROP NOT NULL;
  END IF;
END $$;
