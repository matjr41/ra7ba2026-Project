-- ========================================
-- RAHBA SAFE DATABASE SCHEMA
-- Multi-Tenant E-commerce Platform
-- ========================================
-- Execute this in Neon SQL Editor - SAFE VERSION
-- This will ONLY add missing columns/tables, NOT delete existing data

-- ========================================
-- MISSING COLUMNS ONLY
-- ========================================

-- Add missing columns to User table (only if they don't exist)
DO $$
BEGIN
    -- Check and add createdIp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='createdIp') THEN
        ALTER TABLE "User" ADD COLUMN "createdIp" TEXT;
        RAISE NOTICE 'Added createdIp column';
    END IF;

    -- Check and add lastLoginIp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='lastLoginIp') THEN
        ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;
        RAISE NOTICE 'Added lastLoginIp column';
    END IF;

    -- Check and add loginAttempts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='loginAttempts') THEN
        ALTER TABLE "User" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added loginAttempts column';
    END IF;

    -- Check and add lockedUntil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='lockedUntil') THEN
        ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
        RAISE NOTICE 'Added lockedUntil column';
    END IF;

    -- Check and add deviceId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='deviceId') THEN
        ALTER TABLE "User" ADD COLUMN "deviceId" TEXT;
        RAISE NOTICE 'Added deviceId column';
    END IF;
END $$;

-- ========================================
-- MISSING INDEXES ONLY
-- ========================================

-- Add missing indexes (only if they don't exist)
DO $$
BEGIN
    -- User indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexname='User_email_idx') THEN
        CREATE INDEX "User_email_idx" ON "User"("email");
        RAISE NOTICE 'Added User_email_idx';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexname='User_role_idx') THEN
        CREATE INDEX "User_role_idx" ON "User"("role");
        RAISE NOTICE 'Added User_role_idx';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexname='User_deviceId_idx') THEN
        CREATE INDEX "User_deviceId_idx" ON "User"("deviceId");
        RAISE NOTICE 'Added User_deviceId_idx';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexname='User_phone_idx') THEN
        CREATE INDEX "User_phone_idx" ON "User"("phone");
        RAISE NOTICE 'Added User_phone_idx';
    END IF;
END $$;

-- ========================================
-- MISSING TABLES ONLY (if they don't exist)
-- ========================================

-- Create PlanFeatureFlags if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PlanFeatureFlags') THEN
        CREATE TABLE "PlanFeatureFlags" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
            "plan" "SubscriptionPlan" NOT NULL UNIQUE,
            "variantsEnabled" BOOLEAN NOT NULL DEFAULT false,
            "quantityDiscountsEnabled" BOOLEAN NOT NULL DEFAULT false,
            "checkoutCustomizationEnabled" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PlanFeatureFlags_pkey" PRIMARY KEY ("id")
        );
        
        -- Add trigger for updatedAt
        CREATE TRIGGER "PlanFeatureFlags_updated_at" BEFORE UPDATE ON "PlanFeatureFlags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Insert initial data
        INSERT INTO "PlanFeatureFlags" (plan, variantsEnabled, quantityDiscountsEnabled, checkoutCustomizationEnabled) VALUES
        ('FREE', false, false, false),
        ('STANDARD', true, true, true),
        ('PRO', true, true, true);
        
        RAISE NOTICE 'Created PlanFeatureFlags table';
    END IF;
END $$;

-- Create Notification table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification') THEN
        CREATE TABLE "Notification" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
            "type" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "data" JSONB,
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
        
        -- Add indexes
        CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
        CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
        
        RAISE NOTICE 'Created Notification table';
    END IF;
END $$;

-- ========================================
-- MISSING UNIQUE CONSTRAINTS ONLY
-- ========================================

-- Add missing unique constraints (only if they don't exist)
DO $$
BEGIN
    -- User phone unique constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='User' AND constraint_name='User_phone_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_phone_key" UNIQUE ("phone");
        RAISE NOTICE 'Added User_phone_key constraint';
    END IF;

    -- User tenantId unique constraint  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='User' AND constraint_name='User_tenantId_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_key" UNIQUE ("tenantId");
        RAISE NOTICE 'Added User_tenantId_key constraint';
    END IF;
END $$;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RAHBA SAFE SCHEMA UPDATE COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ No data was deleted';
    RAISE NOTICE '✅ Only missing columns/tables added';
    RAISE NOTICE '✅ Admin user creation should work now';
    RAISE NOTICE '========================================';
END $$;
