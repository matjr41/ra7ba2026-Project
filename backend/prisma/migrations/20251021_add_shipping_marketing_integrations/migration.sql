-- Add new tables for shipping, marketing integrations, and app permissions

-- ShippingConfig table
CREATE TABLE "ShippingConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultShippingFee" DECIMAL(10,2) NOT NULL DEFAULT 600,
    "freeShippingThreshold" DECIMAL(10,2),
    "yalidineEnabled" BOOLEAN NOT NULL DEFAULT false,
    "yalidineApiKey" TEXT,
    "yalidineApiSecret" TEXT,
    "zrExpressEnabled" BOOLEAN NOT NULL DEFAULT false,
    "zrExpressApiKey" TEXT,
    "zrExpressApiSecret" TEXT,
    "customZones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingConfig_pkey" PRIMARY KEY ("id")
);

-- MarketingIntegration table
CREATE TABLE "MarketingIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facebookPixelId" TEXT,
    "facebookAccessToken" TEXT,
    "facebookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tiktokPixelId" TEXT,
    "tiktokAccessToken" TEXT,
    "tiktokEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleAnalyticsId" TEXT,
    "googleSheetsId" TEXT,
    "googleServiceAccount" JSONB,
    "googleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "snapchatPixelId" TEXT,
    "snapchatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingIntegration_pkey" PRIMARY KEY ("id")
);

-- TelegramBot table
CREATE TABLE "TelegramBot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "botToken" TEXT,
    "chatId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnNewOrder" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnOrderStatus" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLowStock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramBot_pkey" PRIMARY KEY ("id")
);

-- CustomDomain table
CREATE TABLE "CustomDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "dnsRecords" JSONB,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- AppPermission table
CREATE TABLE "AppPermission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "canUseCustomDomain" BOOLEAN NOT NULL DEFAULT false,
    "canUseFacebookPixel" BOOLEAN NOT NULL DEFAULT false,
    "canUseTikTokPixel" BOOLEAN NOT NULL DEFAULT false,
    "canUseGoogleSheets" BOOLEAN NOT NULL DEFAULT false,
    "canUseTelegramBot" BOOLEAN NOT NULL DEFAULT false,
    "canUseShippingAPI" BOOLEAN NOT NULL DEFAULT false,
    "canCustomizeTheme" BOOLEAN NOT NULL DEFAULT true,
    "canUseAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "maxProducts" INTEGER NOT NULL DEFAULT 100,
    "maxOrders" INTEGER NOT NULL DEFAULT 1000,
    "maxStorageGB" INTEGER NOT NULL DEFAULT 5,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPermission_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "ShippingConfig_tenantId_key" ON "ShippingConfig"("tenantId");
CREATE UNIQUE INDEX "MarketingIntegration_tenantId_key" ON "MarketingIntegration"("tenantId");
CREATE UNIQUE INDEX "TelegramBot_tenantId_key" ON "TelegramBot"("tenantId");
CREATE UNIQUE INDEX "CustomDomain_tenantId_key" ON "CustomDomain"("tenantId");
CREATE UNIQUE INDEX "CustomDomain_domain_key" ON "CustomDomain"("domain");
CREATE UNIQUE INDEX "AppPermission_tenantId_key" ON "AppPermission"("tenantId");

-- Create indexes
CREATE INDEX "ShippingConfig_tenantId_idx" ON "ShippingConfig"("tenantId");
CREATE INDEX "MarketingIntegration_tenantId_idx" ON "MarketingIntegration"("tenantId");
CREATE INDEX "TelegramBot_tenantId_idx" ON "TelegramBot"("tenantId");
CREATE INDEX "CustomDomain_tenantId_idx" ON "CustomDomain"("tenantId");
CREATE INDEX "CustomDomain_domain_idx" ON "CustomDomain"("domain");
CREATE INDEX "AppPermission_tenantId_idx" ON "AppPermission"("tenantId");

-- Add foreign keys
ALTER TABLE "ShippingConfig" ADD CONSTRAINT "ShippingConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingIntegration" ADD CONSTRAINT "MarketingIntegration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TelegramBot" ADD CONSTRAINT "TelegramBot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppPermission" ADD CONSTRAINT "AppPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
