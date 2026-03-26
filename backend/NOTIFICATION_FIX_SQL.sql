-- ========================================
-- FIX NOTIFICATION TABLE
-- ========================================

-- Create Notification table if not exists
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
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NOTIFICATION TABLE CREATED!';
    RAISE NOTICE '✅ Admin notifications will work now';
    RAISE NOTICE '========================================';
END $$;
