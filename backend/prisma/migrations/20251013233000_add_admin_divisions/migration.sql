-- Create Wilaya, Daira, Baladiya tables to match schema.prisma
-- This migration is idempotent (CREATE ... IF NOT EXISTS where applicable)

-- Wilaya
CREATE TABLE IF NOT EXISTS "Wilaya" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "deliveryFee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wilaya_pkey" PRIMARY KEY ("id")
);

-- Unique and regular index on code (to mirror prisma behavior: unique + index)
CREATE UNIQUE INDEX IF NOT EXISTS "Wilaya_code_key" ON "Wilaya"("code");
CREATE INDEX IF NOT EXISTS "Wilaya_code_idx" ON "Wilaya"("code");

-- Daira
CREATE TABLE IF NOT EXISTS "Daira" (
  "id" TEXT NOT NULL,
  "wilayaCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Daira_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Daira_wilayaCode_idx" ON "Daira"("wilayaCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Daira_wilayaCode_name_key" ON "Daira"("wilayaCode","name");

-- Baladiya
CREATE TABLE IF NOT EXISTS "Baladiya" (
  "id" TEXT NOT NULL,
  "dairaId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Baladiya_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Baladiya_dairaId_idx" ON "Baladiya"("dairaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Baladiya_dairaId_name_key" ON "Baladiya"("dairaId","name");

-- FK: Baladiya -> Daira (safe idempotent version)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Baladiya_dairaId_fkey'
  ) THEN
    ALTER TABLE "Baladiya"
      ADD CONSTRAINT "Baladiya_dairaId_fkey"
      FOREIGN KEY ("dairaId") REFERENCES "Daira"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;