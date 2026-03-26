-- Ensure Payment.createdAt and updatedAt columns exist
-- Idempotent migration for Railway
DO $$
BEGIN
    -- createdAt (timestamp)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
        -- remove default afterwards to mimic prisma behavior
        ALTER TABLE "Payment" ALTER COLUMN "createdAt" DROP DEFAULT;
        RAISE NOTICE 'Added column Payment.createdAt';
    END IF;

    -- updatedAt (timestamp)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
        -- remove default so Prisma can manage
        ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;
        RAISE NOTICE 'Added column Payment.updatedAt';
    END IF;
END $$;
