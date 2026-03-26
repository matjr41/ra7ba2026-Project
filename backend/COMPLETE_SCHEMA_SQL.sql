-- ========================================
-- RAHBA COMPLETE DATABASE SCHEMA
-- Multi-Tenant E-commerce Platform
-- ========================================
-- Execute this in Neon SQL Editor for complete setup

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS "AppPermission" CASCADE;
DROP TABLE IF EXISTS "CustomDomain" CASCADE;
DROP TABLE IF EXISTS "TelegramBot" CASCADE;
DROP TABLE IF EXISTS "MarketingIntegration" CASCADE;
DROP TABLE IF EXISTS "Baladiya" CASCADE;
DROP TABLE IF EXISTS "Daira" CASCADE;
DROP TABLE IF EXISTS "ShipmentProvider" CASCADE;
DROP TABLE IF EXISTS "ShippingOption" CASCADE;
DROP TABLE IF EXISTS "PaymentProof" CASCADE;
DROP TABLE IF EXISTS "Store" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "PlanFeatureFlags" CASCADE;
DROP TABLE IF EXISTS "BundleOffer" CASCADE;
DROP TABLE IF EXISTS "ProductVariant" CASCADE;
DROP TABLE IF EXISTS "ProductOptionValue" CASCADE;
DROP TABLE IF EXISTS "ProductOption" CASCADE;
DROP TABLE IF EXISTS "Wilaya" CASCADE;
DROP TABLE IF EXISTS "Setting" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TABLE IF EXISTS "PasswordReset" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ========================================
-- ENUMS
-- ========================================

-- User Roles
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MERCHANT', 'CUSTOMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tenant Status
DO $$ BEGIN
    CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription Plans
DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STANDARD', 'PRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription Status
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Status
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order Status
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Delivery Companies
DO $$ BEGIN
    CREATE TYPE "DeliveryCompany" AS ENUM ('YALIDINE', 'ZR_EXPRESS', 'JET_EXPRESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Store Subscription Status
DO $$ BEGIN
    CREATE TYPE "StoreSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Proof Status
DO $$ BEGIN
    CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Shipping Type
DO $$ BEGIN
    CREATE TYPE "ShippingType" AS ENUM ('HOME', 'OFFICE', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Method
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('COD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- TABLES
-- ========================================

-- Users Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdIp" TEXT,
    "lastLoginIp" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "tenantId" TEXT,
    "deviceId" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Refresh Tokens
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Password Resets
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- Tenants
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "favicon" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "telegramChatId" TEXT,
    "theme" JSONB,
    "checkoutConfig" JSONB,
    "storeFeatures" JSONB,
    "privacyPolicy" TEXT,
    "termsOfService" TEXT,
    "returnPolicy" TEXT,
    "thankYouMessage" TEXT,
    "thankYouImage" TEXT,
    "shippingConfig" JSONB,
    "integrations" JSONB,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP(3),
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Subscriptions
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Payments
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "plan" "SubscriptionPlan" NOT NULL,
    "baridimobRef" TEXT,
    "payerEmail" TEXT,
    "paymentProof" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Categories
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Products
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "cost" DECIMAL(10,2),
    "sku" TEXT,
    "barcode" TEXT,
    "trackInventory" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB NOT NULL DEFAULT '[]',
    "thumbnail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "seoKeywords" TEXT,
    "weight" DECIMAL(10,2),
    "weightUnit" TEXT DEFAULT 'kg',
    "length" DECIMAL(10,2),
    "width" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "dimensionUnit" TEXT DEFAULT 'cm',
    "shippingFee" DECIMAL(10,2),
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlert" INTEGER,
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "bulkPricing" JSONB DEFAULT '[]',
    "badges" JSONB DEFAULT '[]',
    "relatedProducts" JSONB DEFAULT '[]',
    "crossSellProducts" JSONB DEFAULT '[]',

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Orders
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shippingAddress" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "wilaya" TEXT,
    "daira" TEXT,
    "commune" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "deliveryCompany" "DeliveryCompany",
    "trackingNumber" TEXT,
    "notes" TEXT,
    "customerNotes" TEXT,
    "merchantNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Algerian Wilayas
CREATE TABLE "Wilaya" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wilaya_pkey" PRIMARY KEY ("id")
);

-- Platform Settings
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- Product Options
CREATE TABLE "ProductOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

-- Product Option Values
CREATE TABLE "ProductOptionValue" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

-- Product Variants
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(10,2),
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB NOT NULL,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Bundle Offers
CREATE TABLE "BundleOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "bundlePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleOffer_pkey" PRIMARY KEY ("id")
);

-- Plan Feature Flags
CREATE TABLE "PlanFeatureFlags" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "variantsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quantityDiscountsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "checkoutCustomizationEnabled" BOOLEAN NOT NULL DEFAULT false,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeatureFlags_pkey" PRIMARY KEY ("id")
);

-- Notifications
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Stores
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Payment Proofs
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- Shipping Options
CREATE TABLE "ShippingOption" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ShippingType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "minWeight" DECIMAL(10,2),
    "maxWeight" DECIMAL(10,2),
    "providerId" TEXT,
    "credentials" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingOption_pkey" PRIMARY KEY ("id")
);

-- Shipment Providers
CREATE TABLE "ShipmentProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'DZ',
    "token" TEXT,
    "providerId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentProvider_pkey" PRIMARY KEY ("id")
);

-- Dairas
CREATE TABLE "Daira" (
    "id" TEXT NOT NULL,
    "wilayaCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Daira_pkey" PRIMARY KEY ("id")
);

-- Baladiyas
CREATE TABLE "Baladiya" (
    "id" TEXT NOT NULL,
    "dairaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baladiya_pkey" PRIMARY KEY ("id")
);

-- Marketing Integrations
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

-- Telegram Bots
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

-- Custom Domains
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

-- App Permissions
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

-- ========================================
-- UNIQUE CONSTRAINTS
-- ========================================

ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
ALTER TABLE "User" ADD CONSTRAINT "User_phone_key" UNIQUE ("phone");
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_key" UNIQUE ("tenantId");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_token_key" UNIQUE ("token");

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_subdomain_key" UNIQUE ("subdomain");
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_key" UNIQUE ("ownerId");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_key" UNIQUE ("tenantId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_slug_key" UNIQUE ("tenantId", "slug");

ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_slug_key" UNIQUE ("tenantId", "slug");

ALTER TABLE "Order" ADD CONSTRAINT "Order_orderNumber_key" UNIQUE ("orderNumber");

ALTER TABLE "Wilaya" ADD CONSTRAINT "Wilaya_code_key" UNIQUE ("code");

ALTER TABLE "Setting" ADD CONSTRAINT "Setting_key_key" UNIQUE ("key");

ALTER TABLE "Store" ADD CONSTRAINT "Store_slug_key" UNIQUE ("slug");

ALTER TABLE "ShipmentProvider" ADD CONSTRAINT "ShipmentProvider_name_key" UNIQUE ("name");

ALTER TABLE "Daira" ADD CONSTRAINT "Daira_wilayaCode_name_key" UNIQUE ("wilayaCode", "name");

ALTER TABLE "Baladiya" ADD CONSTRAINT "Baladiya_dairaId_name_key" UNIQUE ("dairaId", "name");

ALTER TABLE "MarketingIntegration" ADD CONSTRAINT "MarketingIntegration_tenantId_key" UNIQUE ("tenantId");

ALTER TABLE "TelegramBot" ADD CONSTRAINT "TelegramBot_tenantId_key" UNIQUE ("tenantId");

ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_tenantId_key" UNIQUE ("tenantId");
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_domain_key" UNIQUE ("domain");

ALTER TABLE "AppPermission" ADD CONSTRAINT "AppPermission_tenantId_key" UNIQUE ("tenantId");

ALTER TABLE "PlanFeatureFlags" ADD CONSTRAINT "PlanFeatureFlags_plan_key" UNIQUE ("plan");

-- ========================================
-- FOREIGN KEYS
-- ========================================

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductOptionValue" ADD CONSTRAINT "ProductOptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BundleOffer" ADD CONSTRAINT "BundleOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShippingOption" ADD CONSTRAINT "ShippingOption_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShippingOption" ADD CONSTRAINT "ShippingOption_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ShipmentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Baladiya" ADD CONSTRAINT "Baladiya_dairaId_fkey" FOREIGN KEY ("dairaId") REFERENCES "Daira"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketingIntegration" ADD CONSTRAINT "MarketingIntegration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramBot" ADD CONSTRAINT "TelegramBot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AppPermission" ADD CONSTRAINT "AppPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_deviceId_idx" ON "User"("deviceId");
CREATE INDEX "User_phone_idx" ON "User"("phone");

CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX "PasswordReset_code_idx" ON "PasswordReset"("code");

CREATE INDEX "Tenant_subdomain_idx" ON "Tenant"("subdomain");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "Tenant_ownerId_idx" ON "Tenant"("ownerId");

CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

CREATE INDEX "Wilaya_code_idx" ON "Wilaya"("code");

CREATE INDEX "Setting_key_idx" ON "Setting"("key");

CREATE INDEX "ProductOption_productId_idx" ON "ProductOption"("productId");

CREATE INDEX "ProductOptionValue_optionId_idx" ON "ProductOptionValue"("optionId");

CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");

CREATE INDEX "BundleOffer_productId_idx" ON "BundleOffer"("productId");
CREATE INDEX "BundleOffer_isActive_idx" ON "BundleOffer"("isActive");

CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX "PaymentProof_storeId_idx" ON "PaymentProof"("storeId");
CREATE INDEX "PaymentProof_status_idx" ON "PaymentProof"("status");

CREATE INDEX "ShippingOption_storeId_idx" ON "ShippingOption"("storeId");
CREATE INDEX "ShippingOption_providerId_idx" ON "ShippingOption"("providerId");
CREATE INDEX "ShippingOption_isActive_idx" ON "ShippingOption"("isActive");

CREATE INDEX "ShipmentProvider_isActive_idx" ON "ShipmentProvider"("isActive");

CREATE INDEX "Daira_wilayaCode_idx" ON "Daira"("wilayaCode");

CREATE INDEX "Baladiya_dairaId_idx" ON "Baladiya"("dairaId");

CREATE INDEX "MarketingIntegration_tenantId_idx" ON "MarketingIntegration"("tenantId");

CREATE INDEX "TelegramBot_tenantId_idx" ON "TelegramBot"("tenantId");

CREATE INDEX "CustomDomain_tenantId_idx" ON "CustomDomain"("tenantId");
CREATE INDEX "CustomDomain_domain_idx" ON "CustomDomain"("domain");

CREATE INDEX "AppPermission_tenantId_idx" ON "AppPermission"("tenantId");

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updatedAt
CREATE TRIGGER "User_updated_at" BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Tenant_updated_at" BEFORE UPDATE ON "Tenant" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Subscription_updated_at" BEFORE UPDATE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Payment_updated_at" BEFORE UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Category_updated_at" BEFORE UPDATE ON "Category" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Product_updated_at" BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Order_updated_at" BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Wilaya_updated_at" BEFORE UPDATE ON "Wilaya" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Setting_updated_at" BEFORE UPDATE ON "Setting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "ProductOption_updated_at" BEFORE UPDATE ON "ProductOption" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "ProductOptionValue_updated_at" BEFORE UPDATE ON "ProductOptionValue" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "ProductVariant_updated_at" BEFORE UPDATE ON "ProductVariant" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "BundleOffer_updated_at" BEFORE UPDATE ON "BundleOffer" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "PlanFeatureFlags_updated_at" BEFORE UPDATE ON "PlanFeatureFlags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Store_updated_at" BEFORE UPDATE ON "Store" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "PaymentProof_updated_at" BEFORE UPDATE ON "PaymentProof" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "ShippingOption_updated_at" BEFORE UPDATE ON "ShippingOption" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "ShipmentProvider_updated_at" BEFORE UPDATE ON "ShipmentProvider" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Daira_updated_at" BEFORE UPDATE ON "Daira" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "Baladiya_updated_at" BEFORE UPDATE ON "Baladiya" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "MarketingIntegration_updated_at" BEFORE UPDATE ON "MarketingIntegration" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "TelegramBot_updated_at" BEFORE UPDATE ON "TelegramBot" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "CustomDomain_updated_at" BEFORE UPDATE ON "CustomDomain" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "AppPermission_updated_at" BEFORE UPDATE ON "AppPermission" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert Plan Feature Flags
INSERT INTO "PlanFeatureFlags" (plan, variantsEnabled, quantityDiscountsEnabled, checkoutCustomizationEnabled) VALUES
('FREE', false, false, false),
('STANDARD', true, true, true),
('PRO', true, true, true);

-- Insert Algerian Wilayas (sample - you can add all 58)
INSERT INTO "Wilaya" (code, name, nameAr, deliveryFee) VALUES
('1', 'Adrar', 'أدرار', 600.00),
('2', 'Chlef', 'الشلف', 350.00),
('3', 'Laghouat', 'الأغواط', 450.00),
('16', 'Alger', 'الجزائر', 300.00),
('31', 'Oran', 'وهران', 350.00);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RAHBA DATABASE SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Indexes: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE 'Ready for production use!';
    RAISE NOTICE '========================================';
END $$;
