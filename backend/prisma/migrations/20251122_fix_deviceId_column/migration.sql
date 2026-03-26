-- Add missing deviceId column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
