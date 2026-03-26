-- Prisma migration: SaaS additions (Store, PaymentProof, ShippingOption, ShipmentProvider, Daira, Baladiya)

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StoreSubscriptionStatus') THEN
    CREATE TYPE "StoreSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProofStatus') THEN
    CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingType') THEN
    CREATE TYPE "ShippingType" AS ENUM ('HOME', 'OFFICE', 'CUSTOM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('COD');
  END IF;
END $$;

-- Table: ShipmentProvider
CREATE TABLE IF NOT EXISTS "ShipmentProvider" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'DZ',
  "token" TEXT,
  "providerId" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShipmentProvider_name_key" ON "ShipmentProvider" ("name");
CREATE INDEX IF NOT EXISTS "ShipmentProvider_isActive_idx" ON "ShipmentProvider" ("isActive");

-- Table: Store
CREATE TABLE IF NOT EXISTS "Store" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "wilaya" TEXT,
  "daira" TEXT,
  "baladiya" TEXT,
  "logoUrl" TEXT,
  "bannerUrl" TEXT,
  "colors" JSONB,
  "landingPage" JSONB,
  "checkoutConfig" JSONB,
  "subscriptionStatus" "StoreSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Store_slug_key" ON "Store" ("slug");

-- Table: ShippingOption
CREATE TABLE IF NOT EXISTS "ShippingOption" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT,
  "name" TEXT NOT NULL,
  "type" "ShippingType" NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "minWeight" DECIMAL(10,2),
  "maxWeight" DECIMAL(10,2),
  "providerId" TEXT,
  "credentials" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingOption_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ShippingOption_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ShipmentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShippingOption_storeId_idx" ON "ShippingOption" ("storeId");
CREATE INDEX IF NOT EXISTS "ShippingOption_providerId_idx" ON "ShippingOption" ("providerId");
CREATE INDEX IF NOT EXISTS "ShippingOption_isActive_idx" ON "ShippingOption" ("isActive");

-- Table: PaymentProof
CREATE TABLE IF NOT EXISTS "PaymentProof" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "uploadedById" TEXT,
  "fileUrl" TEXT NOT NULL,
  "emailOfStore" TEXT NOT NULL,
  "amount" DECIMAL(10,2),
  "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentProof_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PaymentProof_storeId_idx" ON "PaymentProof" ("storeId");
CREATE INDEX IF NOT EXISTS "PaymentProof_status_idx" ON "PaymentProof" ("status");

-- Table: Daira
CREATE TABLE IF NOT EXISTS "Daira" (
  "id" TEXT PRIMARY KEY,
  "wilayaCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "Daira_wilayaCode_idx" ON "Daira" ("wilayaCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Daira_wilayaCode_name_key" ON "Daira" ("wilayaCode", "name");

-- Table: Baladiya
CREATE TABLE IF NOT EXISTS "Baladiya" (
  "id" TEXT PRIMARY KEY,
  "dairaId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Baladiya_dairaId_fkey" FOREIGN KEY ("dairaId") REFERENCES "Daira"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Baladiya_dairaId_idx" ON "Baladiya" ("dairaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Baladiya_dairaId_name_key" ON "Baladiya" ("dairaId", "name");
