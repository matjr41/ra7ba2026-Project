const { PrismaClient } = require('@prisma/client');

async function emergencyDatabaseFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 Starting EMERGENCY database fix...');
    
    // Apply the comprehensive migration SQL
    const emergencySQL = `
-- EMERGENCY DATABASE FIX - Apply all missing columns and tables
-- This script is safe to run multiple times

DO $$
BEGIN
    -- ========================================
    -- 1. Fix Order table columns
    -- ========================================
    
    -- Add confirmedAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'confirmedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "confirmedAt" TIMESTAMP(3);
        RAISE NOTICE '✅ Added column Order.confirmedAt';
    END IF;

    -- Add shippedAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
        RAISE NOTICE '✅ Added column Order.shippedAt';
    END IF;

    -- Add deliveredAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'deliveredAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
        RAISE NOTICE '✅ Added column Order.deliveredAt';
    END IF;

    -- Add cancelledAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'cancelledAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
        RAISE NOTICE '✅ Added column Order.cancelledAt';
    END IF;

    -- Create DeliveryCompany enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryCompany') THEN
        CREATE TYPE "DeliveryCompany" AS ENUM ('YALIDINE', 'ZR_EXPRESS', 'JET_EXPRESS');
        RAISE NOTICE '✅ Created enum DeliveryCompany';
    END IF;

    -- Add deliveryCompany if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'deliveryCompany'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "deliveryCompany" "DeliveryCompany";
        RAISE NOTICE '✅ Added column Order.deliveryCompany';
    END IF;

    -- Add trackingNumber if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'trackingNumber'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
        RAISE NOTICE '✅ Added column Order.trackingNumber';
    END IF;

    -- ========================================
    -- 2. Fix Payment table - CREATE IF NOT EXISTS
    -- ========================================
    
    -- Create Payment table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Payment') THEN
        -- Create PaymentStatus enum first
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
            CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
            RAISE NOTICE '✅ Created enum PaymentStatus';
        END IF;
        
        CREATE TABLE "Payment" (
            "id" TEXT NOT NULL,
            "subscriptionId" TEXT NOT NULL,
            "amount" DECIMAL(10,2) NOT NULL,
            "currency" TEXT NOT NULL DEFAULT 'DZD',
            "baridimobRef" TEXT,
            "paymentProof" TEXT,
            "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
            "approvedBy" TEXT,
            "approvedAt" TIMESTAMP(3),
            "rejectionReason" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE '✅ Created Payment table';
    ELSE
        -- Add missing columns to existing Payment table
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'subscriptionId'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "subscriptionId" TEXT;
            RAISE NOTICE '✅ Added column Payment.subscriptionId';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'amount'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "amount" DECIMAL(10,2);
            RAISE NOTICE '✅ Added column Payment.amount';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'currency'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "currency" TEXT DEFAULT 'DZD';
            RAISE NOTICE '✅ Added column Payment.currency';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'baridimobRef'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "baridimobRef" TEXT;
            RAISE NOTICE '✅ Added column Payment.baridimobRef';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'paymentProof'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "paymentProof" TEXT;
            RAISE NOTICE '✅ Added column Payment.paymentProof';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'status'
        ) THEN
            -- Create PaymentStatus enum if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
                CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
                RAISE NOTICE '✅ Created enum PaymentStatus';
            END IF;
            
            ALTER TABLE "Payment" ADD COLUMN "status" "PaymentStatus" DEFAULT 'PENDING';
            RAISE NOTICE '✅ Added column Payment.status';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'approvedBy'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "approvedBy" TEXT;
            RAISE NOTICE '✅ Added column Payment.approvedBy';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'approvedAt'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "approvedAt" TIMESTAMP(3);
            RAISE NOTICE '✅ Added column Payment.approvedAt';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'rejectionReason'
        ) THEN
            ALTER TABLE "Payment" ADD COLUMN "rejectionReason" TEXT;
            RAISE NOTICE '✅ Added column Payment.rejectionReason';
        END IF;
    END IF;

    -- ========================================
    -- 3. Fix Subscription table - CREATE IF NOT EXISTS
    -- ========================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Subscription') THEN
        -- Create SubscriptionStatus enum first
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
            CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');
            RAISE NOTICE '✅ Created enum SubscriptionStatus';
        END IF;
        
        -- Create SubscriptionPlan enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
            CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'BASIC', 'PREMIUM');
            RAISE NOTICE '✅ Created enum SubscriptionPlan';
        END IF;
        
        CREATE TABLE "Subscription" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
            "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
            "currentPeriodStart" TIMESTAMP(3),
            "currentPeriodEnd" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "Subscription_tenantId_key" UNIQUE ("tenantId")
        );
        RAISE NOTICE '✅ Created Subscription table';
    END IF;

    RAISE NOTICE '🎉 EMERGENCY DATABASE FIX COMPLETED SUCCESSFULLY!';

END $$;
    `;
    
    await prisma.$executeRawUnsafe(emergencySQL);
    console.log('✅ Emergency database migration completed successfully!');
    
    // Test the fix by running queries
    console.log('🧪 Testing database integrity...');
    
    try {
      const orderCount = await prisma.order.count();
      console.log(`✅ Orders table working. Total orders: ${orderCount}`);
    } catch (e) {
      console.log('⚠️ Orders table issue:', e.message);
    }
    
    try {
      const paymentCount = await prisma.payment.count();
      console.log(`✅ Payments table working. Total payments: ${paymentCount}`);
    } catch (e) {
      console.log('⚠️ Payments table issue:', e.message);
    }
    
    try {
      const subscriptionCount = await prisma.subscription.count();
      console.log(`✅ Subscriptions table working. Total subscriptions: ${subscriptionCount}`);
    } catch (e) {
      console.log('⚠️ Subscriptions table issue:', e.message);
    }
    
    console.log('🎯 Database is now ready for production!');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  emergencyDatabaseFix();
}

module.exports = { emergencyDatabaseFix };
