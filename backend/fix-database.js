const { PrismaClient } = require('@prisma/client');

async function fixDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database fix...');
    
    // Apply the migration SQL directly
    const migrationSQL = `
-- Add missing timestamp columns to Order table
-- Safe/idempotent migration - checks for column existence first

DO $$
BEGIN
    -- Add confirmedAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'confirmedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "confirmedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column Order.confirmedAt';
    END IF;

    -- Add shippedAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column Order.shippedAt';
    END IF;

    -- Add deliveredAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'deliveredAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column Order.deliveredAt';
    END IF;

    -- Add cancelledAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'cancelledAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column Order.cancelledAt';
    END IF;

    -- Add deliveryCompany if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'deliveryCompany'
    ) THEN
        -- First create the enum type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryCompany') THEN
            CREATE TYPE "DeliveryCompany" AS ENUM ('YALIDINE', 'ZR_EXPRESS', 'JET_EXPRESS');
            RAISE NOTICE 'Created enum DeliveryCompany';
        END IF;
        
        ALTER TABLE "Order" ADD COLUMN "deliveryCompany" "DeliveryCompany";
        RAISE NOTICE 'Added column Order.deliveryCompany';
    END IF;

    -- Add trackingNumber if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'trackingNumber'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
        RAISE NOTICE 'Added column Order.trackingNumber';
    END IF;

    -- Fix Payment table - add subscriptionId if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'subscriptionId'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "subscriptionId" TEXT;
        RAISE NOTICE 'Added column Payment.subscriptionId';
    END IF;

    -- Add other missing Payment columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'amount'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "amount" DECIMAL(10,2);
        RAISE NOTICE 'Added column Payment.amount';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'currency'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "currency" TEXT DEFAULT 'DZD';
        RAISE NOTICE 'Added column Payment.currency';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'baridimobRef'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "baridimobRef" TEXT;
        RAISE NOTICE 'Added column Payment.baridimobRef';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'paymentProof'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "paymentProof" TEXT;
        RAISE NOTICE 'Added column Payment.paymentProof';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'status'
    ) THEN
        -- Create PaymentStatus enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
            CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
            RAISE NOTICE 'Created enum PaymentStatus';
        END IF;
        
        ALTER TABLE "Payment" ADD COLUMN "status" "PaymentStatus" DEFAULT 'PENDING';
        RAISE NOTICE 'Added column Payment.status';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'approvedBy'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "approvedBy" TEXT;
        RAISE NOTICE 'Added column Payment.approvedBy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'approvedAt'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "approvedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column Payment.approvedAt';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'rejectionReason'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "rejectionReason" TEXT;
        RAISE NOTICE 'Added column Payment.rejectionReason';
    END IF;

END $$;
    `;
    
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Database migration completed successfully!');
    
    // Test the fix by running a simple query
    const orderCount = await prisma.order.count();
    console.log('✅ Database is working correctly. Total orders: ' + orderCount);
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixDatabase();
}

module.exports = { fixDatabase };
