-- Ensure Product.images is JSONB to match Prisma schema
-- Safe conversion from TEXT[] (or other) to JSONB

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'images' AND data_type <> 'jsonb'
  ) THEN
    -- Convert any non-JSONB images column (e.g., TEXT[]) to JSONB
    ALTER TABLE "Product"
      ALTER COLUMN "images" TYPE JSONB
      USING to_jsonb("images");
    RAISE NOTICE 'Converted Product.images to JSONB';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do not fail entire migration if casting fails; log and continue
  RAISE NOTICE 'Skipping Product.images type conversion (already JSONB or incompatible type)';
END $$;
