-- Add Order.customerNotes and Order.merchantNotes columns if missing
-- Safe/idempotent migration
DO $$
BEGIN
    -- customerNotes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'customerNotes'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "customerNotes" TEXT;
        RAISE NOTICE 'Added column Order.customerNotes';
    END IF;

    -- merchantNotes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'merchantNotes'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "merchantNotes" TEXT;
        RAISE NOTICE 'Added column Order.merchantNotes';
    END IF;
END $$;
