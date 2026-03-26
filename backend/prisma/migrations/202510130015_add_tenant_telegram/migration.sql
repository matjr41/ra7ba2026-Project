-- Add telegramChatId to Tenant for merchant Telegram notifications
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
