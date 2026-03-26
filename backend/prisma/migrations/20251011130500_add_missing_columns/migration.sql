-- Add missing columns that weren't created on the Railway database
-- Migration is safe/idempotent by testing existence first.

DO $$
BEGIN
  ------------------------------------------------------------------
  -- Payment.payerEmail
  ------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'payerEmail'
  ) THEN
      ALTER TABLE "Payment" ADD COLUMN "payerEmail" TEXT;
      RAISE NOTICE 'Added column Payment.payerEmail';
  END IF;

  ------------------------------------------------------------------
  -- Payment.baridimobRef (nullable)
  ------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'baridimobRef'
  ) THEN
      ALTER TABLE "Payment" ADD COLUMN "baridimobRef" TEXT;
      RAISE NOTICE 'Added column Payment.baridimobRef';
  END IF;

  ------------------------------------------------------------------
  -- Order.customerId (nullable FK)
  ------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'customerId'
  ) THEN
      ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;
      RAISE NOTICE 'Added column Order.customerId';
  END IF;

  ------------------------------------------------------------------
  -- Tenant.checkoutConfig (JSONB)
  ------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'checkoutConfig'
  ) THEN
      ALTER TABLE "Tenant" ADD COLUMN "checkoutConfig" JSONB;
      RAISE NOTICE 'Added column Tenant.checkoutConfig';
  END IF;
END $$;
