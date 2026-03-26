-- Migration: Add Password Reset Table
-- Date: 2024-11-05
-- Description: إضافة جدول لتخزين أكواد إعادة تعيين كلمة السر

-- Create PasswordReset table
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX IF NOT EXISTS "PasswordReset_code_idx" ON "PasswordReset"("code");

-- Clean up expired/used codes (optional maintenance query)
-- You can run this periodically via a cron job:
-- DELETE FROM "PasswordReset" WHERE "expiresAt" < NOW() OR "used" = true;
