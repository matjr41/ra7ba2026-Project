-- Sync missing columns on Order to match current Prisma schema
-- Safe to run multiple times; checks for column existence first

DO $$
BEGIN
    -- Add wilaya (customer province) if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'wilaya'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "wilaya" TEXT;
        RAISE NOTICE 'Added column Order.wilaya';
    END IF;

    -- Add commune (customer commune) if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'commune'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "commune" TEXT;
        RAISE NOTICE 'Added column Order.commune';
    END IF;

    -- Add address if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'address'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "address" TEXT;
        RAISE NOTICE 'Added column Order.address';
    END IF;

    -- Add postalCode if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'postalCode'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "postalCode" TEXT;
        RAISE NOTICE 'Added column Order.postalCode';
    END IF;

    -- Ensure shippingCost exists (legacy name used by DB). Do NOT change type if exists.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippingCost'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added column Order.shippingCost with default 0';
        -- Drop default to avoid forcing value on every insert (optional)
        ALTER TABLE "Order" ALTER COLUMN "shippingCost" DROP DEFAULT;
    END IF;
END $$;
