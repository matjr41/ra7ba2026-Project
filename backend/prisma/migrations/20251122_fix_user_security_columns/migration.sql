-- Add missing security columns to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "createdIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP;
