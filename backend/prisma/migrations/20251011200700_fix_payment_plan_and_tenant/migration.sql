-- Idempotent migration to fix Payment model and enum
-- 0) Ensure enum type exists (case-sensitive name)
DO $$
BEGIN
  IF to_regtype('public."SubscriptionPlan"') IS NULL THEN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('STANDARD', 'PRO');
  END IF;
END $$;

-- 1) Ensure enum value PRO exists on SubscriptionPlan
DO $$
DECLARE t regtype := to_regtype('public."SubscriptionPlan"');
BEGIN
  IF t IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'PRO'
        AND enumtypid = t
    ) THEN
      EXECUTE 'ALTER TYPE "SubscriptionPlan" ADD VALUE ''PRO''';
    END IF;
  END IF;
END $$;

-- 2) Add plan column to Payment if missing (default STANDARD then drop default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'plan'
  ) THEN
    ALTER TABLE "Payment" ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STANDARD';
    -- Drop default to match Prisma behavior
    ALTER TABLE "Payment" ALTER COLUMN "plan" DROP DEFAULT;
    RAISE NOTICE 'Added column Payment.plan';
  END IF;
END $$;

-- 3) Add tenantId to Payment and backfill from Subscription if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE "Payment" ADD COLUMN "tenantId" TEXT;
    RAISE NOTICE 'Added column Payment.tenantId';
  END IF;
END $$;

-- Backfill tenantId from related Subscription
UPDATE "Payment" p
SET "tenantId" = s."tenantId"
FROM "Subscription" s
WHERE p."subscriptionId" = s."id" AND p."tenantId" IS NULL;

-- Add FK and NOT NULL + index if not already present
DO $$
BEGIN
  -- Set NOT NULL only if there are no NULLs
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'tenantId') THEN
    IF NOT EXISTS (SELECT 1 FROM "Payment" WHERE "tenantId" IS NULL) THEN
      ALTER TABLE "Payment" ALTER COLUMN "tenantId" SET NOT NULL;
    END IF;
  END IF;

  -- Add FK if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'Payment'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'tenantId'
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- Add index if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Payment_tenantId_idx'
  ) THEN
    CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
  END IF;
END $$;
