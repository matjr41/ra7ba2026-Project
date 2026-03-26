-- Force add descriptionAr column to Tenant if it doesn't exist
-- This migration is idempotent and safe to run multiple times

DO $$ 
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Tenant' 
        AND column_name = 'descriptionAr'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "descriptionAr" TEXT;
        RAISE NOTICE 'Column descriptionAr added to Tenant table';
    ELSE
        RAISE NOTICE 'Column descriptionAr already exists in Tenant table';
    END IF;
END $$;
