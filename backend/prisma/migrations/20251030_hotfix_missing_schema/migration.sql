-- Hotfix: Ensure missing columns/tables exist on production (Supabase)
-- - Add Product.comparePrice
-- - Add Order.daira
-- - Create PlanFeatureFlags table and seed defaults

DO $$
BEGIN
    -- Product.comparePrice
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'comparePrice'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "comparePrice" DECIMAL(10,2);
        RAISE NOTICE 'Added column Product.comparePrice';
    END IF;

    -- Order.daira
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'daira'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "daira" TEXT;
        RAISE NOTICE 'Added column Order.daira';
    END IF;

    -- PlanFeatureFlags table (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'PlanFeatureFlags'
    ) THEN
        CREATE TABLE "PlanFeatureFlags" (
            id TEXT PRIMARY KEY,
            plan "SubscriptionPlan" NOT NULL UNIQUE,
            "variantsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "quantityDiscountsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "checkoutCustomizationEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table PlanFeatureFlags';
    END IF;
END $$;

-- Seed only for existing enum labels to avoid failures
DO $$
DECLARE has_free BOOLEAN;
DECLARE has_standard BOOLEAN;
DECLARE has_pro BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'FREE'
  ) INTO has_free;

  SELECT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'STANDARD'
  ) INTO has_standard;

  SELECT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'PRO'
  ) INTO has_pro;

  IF has_free THEN
    INSERT INTO "PlanFeatureFlags"(id, plan, "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled", "createdAt", "updatedAt")
    VALUES (md5(random()::text || clock_timestamp()::text), 'FREE', TRUE, TRUE, TRUE, now(), now())
    ON CONFLICT (plan) DO NOTHING;
  END IF;

  IF has_standard THEN
    INSERT INTO "PlanFeatureFlags"(id, plan, "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled", "createdAt", "updatedAt")
    VALUES (md5(random()::text || clock_timestamp()::text), 'STANDARD', FALSE, FALSE, TRUE, now(), now())
    ON CONFLICT (plan) DO NOTHING;
  END IF;

  IF has_pro THEN
    INSERT INTO "PlanFeatureFlags"(id, plan, "variantsEnabled", "quantityDiscountsEnabled", "checkoutCustomizationEnabled", "createdAt", "updatedAt")
    VALUES (md5(random()::text || clock_timestamp()::text), 'PRO', TRUE, TRUE, TRUE, now(), now())
    ON CONFLICT (plan) DO NOTHING;
  END IF;
END $$;
