-- Add PENDING_PAYMENT to SubscriptionStatus enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public."SubscriptionStatus"'::regtype
    AND enumlabel = 'PENDING_PAYMENT'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING_PAYMENT';
  END IF;
END $$;
