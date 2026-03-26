-- Migration: Security Enhancements
-- Date: 2025-01-07
-- Description: إضافة حقول الأمان والتتبع للمستخدمين

-- Add security and tracking columns to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "createdIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- Create index on createdIp for faster IP-based queries
CREATE INDEX IF NOT EXISTS "User_createdIp_idx" ON "User"("createdIp");

-- Create index on loginAttempts and lockedUntil for faster brute force checks
CREATE INDEX IF NOT EXISTS "User_loginAttempts_idx" ON "User"("loginAttempts");
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx" ON "User"("lockedUntil");

-- Comment the changes
COMMENT ON COLUMN "User"."createdIp" IS 'IP address used during registration';
COMMENT ON COLUMN "User"."lastLoginIp" IS 'Last login IP address';
COMMENT ON COLUMN "User"."loginAttempts" IS 'Failed login attempts counter';
COMMENT ON COLUMN "User"."lockedUntil" IS 'Account lock expiry timestamp';
