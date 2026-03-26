-- ==========================================
-- Rahba E-commerce Platform - Complete SQL Schema
-- نفذ هذا الكود في Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MERCHANT', 'CUSTOMER');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STANDARD', 'PRO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE "DeliveryCompany" AS ENUM ('YALIDINE', 'ZR_EXPRESS', 'JET_EXPRESS');
CREATE TYPE "StoreSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ShippingType" AS ENUM ('HOME', 'OFFICE', 'CUSTOM');
CREATE TYPE "PaymentMethod" AS ENUM ('COD');

-- ==================== TABLES ====================

-- Users Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "role" "UserRole" DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN DEFAULT true,
    "emailVerified" BOOLEAN DEFAULT false,
    "tenantId" UUID UNIQUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens
CREATE TABLE "RefreshToken" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "token" VARCHAR(500) UNIQUE NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Tenants (Stores)
CREATE TABLE "Tenant" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subdomain" VARCHAR(100) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "logo" VARCHAR(500),
    "banner" VARCHAR(500),
    "phone" VARCHAR(50),
    "address" TEXT,
    "telegramChatId" VARCHAR(100),
    "theme" JSONB,
    "checkoutConfig" JSONB,
    "storeFeatures" JSONB,
    "privacyPolicy" TEXT,
    "termsOfService" TEXT,
    "returnPolicy" TEXT,
    "thankYouMessage" TEXT,
    "thankYouImage" VARCHAR(500),
    "status" "TenantStatus" DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP,
    "orderCount" INTEGER DEFAULT 0,
    "productCount" INTEGER DEFAULT 0,
    "ownerId" UUID UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Subscriptions
CREATE TABLE "Subscription" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "plan" "SubscriptionPlan" DEFAULT 'FREE',
    "status" "SubscriptionStatus" DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Payments
CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subscriptionId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'DZD',
    "plan" "SubscriptionPlan" NOT NULL,
    "baridimobRef" VARCHAR(255),
    "payerEmail" VARCHAR(255),
    "paymentProof" VARCHAR(500),
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "approvedBy" VARCHAR(255),
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Categories
CREATE TABLE "Category" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(500),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    UNIQUE ("tenantId", "slug")
);

-- Products
CREATE TABLE "Product" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID NOT NULL,
    "categoryId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "comparePrice" DECIMAL(10, 2),
    "cost" DECIMAL(10, 2),
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "trackInventory" BOOLEAN DEFAULT false,
    "stock" INTEGER DEFAULT 0,
    "images" JSONB DEFAULT '[]',
    "thumbnail" VARCHAR(500),
    "isActive" BOOLEAN DEFAULT true,
    "isFeatured" BOOLEAN DEFAULT false,
    "views" INTEGER DEFAULT 0,
    "metaTitle" VARCHAR(255),
    "metaDescription" TEXT,
    "seoKeywords" TEXT,
    "weight" DECIMAL(10, 2),
    "weightUnit" VARCHAR(10) DEFAULT 'kg',
    "length" DECIMAL(10, 2),
    "width" DECIMAL(10, 2),
    "height" DECIMAL(10, 2),
    "dimensionUnit" VARCHAR(10) DEFAULT 'cm',
    "shippingFee" DECIMAL(10, 2),
    "freeShipping" BOOLEAN DEFAULT false,
    "lowStockAlert" INTEGER,
    "allowBackorder" BOOLEAN DEFAULT false,
    "bulkPricing" JSONB DEFAULT '[]',
    "badges" JSONB DEFAULT '[]',
    "relatedProducts" JSONB DEFAULT '[]',
    "crossSellProducts" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL,
    UNIQUE ("tenantId", "slug")
);

-- Orders
CREATE TABLE "Order" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID NOT NULL,
    "customerId" UUID,
    "customerName" VARCHAR(255) NOT NULL,
    "customerEmail" VARCHAR(255),
    "customerPhone" VARCHAR(50) NOT NULL,
    "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
    "status" "OrderStatus" DEFAULT 'PENDING',
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "shippingCost" DECIMAL(10, 2) NOT NULL,
    "total" DECIMAL(10, 2) NOT NULL,
    "wilaya" VARCHAR(100) NOT NULL,
    "daira" VARCHAR(100),
    "commune" VARCHAR(100),
    "address" TEXT NOT NULL,
    "shippingAddress" TEXT DEFAULT '',
    "postalCode" VARCHAR(20),
    "deliveryCompany" "DeliveryCompany",
    "trackingNumber" VARCHAR(100),
    "customerNotes" TEXT,
    "merchantNotes" TEXT,
    "confirmedAt" TIMESTAMP,
    "shippedAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "cancelledAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Order Items
CREATE TABLE "OrderItem" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "productNameAr" VARCHAR(255) NOT NULL,
    "productImage" VARCHAR(500),
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT
);

-- Wilayas
CREATE TABLE "Wilaya" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" VARCHAR(10) UNIQUE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "deliveryFee" DECIMAL(10, 2) DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE "Setting" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) UNIQUE NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Options
CREATE TABLE "ProductOption" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "position" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Product Option Values
CREATE TABLE "ProductOptionValue" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "optionId" UUID NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "position" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE
);

-- Product Variants
CREATE TABLE "ProductVariant" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "price" DECIMAL(10, 2),
    "stock" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "options" JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Bundle Offers
CREATE TABLE "BundleOffer" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "bundlePrice" DECIMAL(10, 2) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- Plan Feature Flags
CREATE TABLE "PlanFeatureFlags" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "plan" "SubscriptionPlan" UNIQUE NOT NULL,
    "variantsEnabled" BOOLEAN DEFAULT false,
    "quantityDiscountsEnabled" BOOLEAN DEFAULT false,
    "checkoutCustomizationEnabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores (SaaS)
CREATE TABLE "Store" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) UNIQUE NOT NULL,
    "ownerId" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "wilaya" VARCHAR(100),
    "daira" VARCHAR(100),
    "baladiya" VARCHAR(100),
    "logoUrl" VARCHAR(500),
    "bannerUrl" VARCHAR(500),
    "colors" JSONB,
    "landingPage" JSONB,
    "checkoutConfig" JSONB,
    "subscriptionStatus" "StoreSubscriptionStatus" DEFAULT 'PENDING',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Payment Proofs
CREATE TABLE "PaymentProof" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "storeId" UUID NOT NULL,
    "uploadedById" UUID,
    "fileUrl" VARCHAR(500) NOT NULL,
    "emailOfStore" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(10, 2),
    "status" "PaymentProofStatus" DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE,
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Shipment Providers
CREATE TABLE "ShipmentProvider" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "country" VARCHAR(10) DEFAULT 'DZ',
    "token" VARCHAR(500),
    "providerId" VARCHAR(100),
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipping Options
CREATE TABLE "ShippingOption" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "storeId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "type" "ShippingType" NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "minWeight" DECIMAL(10, 2),
    "maxWeight" DECIMAL(10, 2),
    "providerId" UUID,
    "credentials" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL,
    FOREIGN KEY ("providerId") REFERENCES "ShipmentProvider"("id") ON DELETE SET NULL
);

-- Dairas
CREATE TABLE "Daira" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "wilayaCode" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("wilayaCode", "name")
);

-- Baladiyas
CREATE TABLE "Baladiya" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "dairaId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("dairaId") REFERENCES "Daira"("id") ON DELETE CASCADE,
    UNIQUE ("dairaId", "name")
);

-- Shipping Config
CREATE TABLE "ShippingConfig" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "defaultShippingFee" DECIMAL(10, 2) DEFAULT 600,
    "freeShippingThreshold" DECIMAL(10, 2),
    "yalidineEnabled" BOOLEAN DEFAULT false,
    "yalidineApiKey" VARCHAR(500),
    "yalidineApiSecret" VARCHAR(500),
    "zrExpressEnabled" BOOLEAN DEFAULT false,
    "zrExpressApiKey" VARCHAR(500),
    "zrExpressApiSecret" VARCHAR(500),
    "customZones" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Marketing Integration
CREATE TABLE "MarketingIntegration" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "facebookPixelId" VARCHAR(100),
    "facebookAccessToken" VARCHAR(500),
    "facebookEnabled" BOOLEAN DEFAULT false,
    "tiktokPixelId" VARCHAR(100),
    "tiktokAccessToken" VARCHAR(500),
    "tiktokEnabled" BOOLEAN DEFAULT false,
    "googleAnalyticsId" VARCHAR(100),
    "googleSheetsId" VARCHAR(100),
    "googleServiceAccount" JSONB,
    "googleEnabled" BOOLEAN DEFAULT false,
    "snapchatPixelId" VARCHAR(100),
    "snapchatEnabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Telegram Bot
CREATE TABLE "TelegramBot" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "botToken" VARCHAR(500),
    "chatId" VARCHAR(100),
    "enabled" BOOLEAN DEFAULT false,
    "notifyOnNewOrder" BOOLEAN DEFAULT true,
    "notifyOnOrderStatus" BOOLEAN DEFAULT true,
    "notifyOnLowStock" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Custom Domain
CREATE TABLE "CustomDomain" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "domain" VARCHAR(255) UNIQUE NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "dnsRecords" JSONB,
    "sslEnabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- App Permissions
CREATE TABLE "AppPermission" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID UNIQUE NOT NULL,
    "canUseCustomDomain" BOOLEAN DEFAULT false,
    "canUseFacebookPixel" BOOLEAN DEFAULT false,
    "canUseTikTokPixel" BOOLEAN DEFAULT false,
    "canUseGoogleSheets" BOOLEAN DEFAULT false,
    "canUseTelegramBot" BOOLEAN DEFAULT false,
    "canUseShippingAPI" BOOLEAN DEFAULT false,
    "canCustomizeTheme" BOOLEAN DEFAULT true,
    "canUseAdvancedAnalytics" BOOLEAN DEFAULT false,
    "maxProducts" INTEGER DEFAULT 100,
    "maxOrders" INTEGER DEFAULT 1000,
    "maxStorageGB" INTEGER DEFAULT 5,
    "grantedBy" VARCHAR(255),
    "grantedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- ==================== INDEXES ====================

CREATE INDEX idx_user_email ON "User"("email");
CREATE INDEX idx_user_role ON "User"("role");
CREATE INDEX idx_refreshtoken_userid ON "RefreshToken"("userId");
CREATE INDEX idx_refreshtoken_token ON "RefreshToken"("token");
CREATE INDEX idx_tenant_subdomain ON "Tenant"("subdomain");
CREATE INDEX idx_tenant_status ON "Tenant"("status");
CREATE INDEX idx_tenant_ownerid ON "Tenant"("ownerId");
CREATE INDEX idx_subscription_tenantid ON "Subscription"("tenantId");
CREATE INDEX idx_subscription_status ON "Subscription"("status");
CREATE INDEX idx_payment_subscriptionid ON "Payment"("subscriptionId");
CREATE INDEX idx_payment_tenantid ON "Payment"("tenantId");
CREATE INDEX idx_payment_status ON "Payment"("status");
CREATE INDEX idx_category_tenantid ON "Category"("tenantId");
CREATE INDEX idx_product_tenantid ON "Product"("tenantId");
CREATE INDEX idx_product_categoryid ON "Product"("categoryId");
CREATE INDEX idx_product_isactive ON "Product"("isActive");
CREATE INDEX idx_order_tenantid ON "Order"("tenantId");
CREATE INDEX idx_order_customerid ON "Order"("customerId");
CREATE INDEX idx_order_status ON "Order"("status");
CREATE INDEX idx_order_ordernumber ON "Order"("orderNumber");
CREATE INDEX idx_orderitem_orderid ON "OrderItem"("orderId");
CREATE INDEX idx_orderitem_productid ON "OrderItem"("productId");
CREATE INDEX idx_wilaya_code ON "Wilaya"("code");
CREATE INDEX idx_setting_key ON "Setting"("key");
CREATE INDEX idx_productoption_productid ON "ProductOption"("productId");
CREATE INDEX idx_productoptionvalue_optionid ON "ProductOptionValue"("optionId");
CREATE INDEX idx_productvariant_productid ON "ProductVariant"("productId");
CREATE INDEX idx_productvariant_isactive ON "ProductVariant"("isActive");
CREATE INDEX idx_bundleoffer_productid ON "BundleOffer"("productId");
CREATE INDEX idx_bundleoffer_isactive ON "BundleOffer"("isActive");
CREATE INDEX idx_notification_isread ON "Notification"("isRead");
CREATE INDEX idx_notification_createdat ON "Notification"("createdAt");
CREATE INDEX idx_paymentproof_storeid ON "PaymentProof"("storeId");
CREATE INDEX idx_paymentproof_status ON "PaymentProof"("status");
CREATE INDEX idx_shippingoption_storeid ON "ShippingOption"("storeId");
CREATE INDEX idx_shippingoption_providerid ON "ShippingOption"("providerId");
CREATE INDEX idx_shippingoption_isactive ON "ShippingOption"("isActive");
CREATE INDEX idx_shipmentprovider_isactive ON "ShipmentProvider"("isActive");
CREATE INDEX idx_daira_wilayacode ON "Daira"("wilayaCode");
CREATE INDEX idx_baladiya_dairaid ON "Baladiya"("dairaId");
CREATE INDEX idx_shippingconfig_tenantid ON "ShippingConfig"("tenantId");
CREATE INDEX idx_marketingintegration_tenantid ON "MarketingIntegration"("tenantId");
CREATE INDEX idx_telegrambot_tenantid ON "TelegramBot"("tenantId");
CREATE INDEX idx_customdomain_tenantid ON "CustomDomain"("tenantId");
CREATE INDEX idx_customdomain_domain ON "CustomDomain"("domain");
CREATE INDEX idx_apppermission_tenantid ON "AppPermission"("tenantId");

-- ==================== TRIGGERS FOR UPDATED_AT ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_updated_at BEFORE UPDATE ON "Tenant" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON "Category" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wilaya_updated_at BEFORE UPDATE ON "Wilaya" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_setting_updated_at BEFORE UPDATE ON "Setting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productoption_updated_at BEFORE UPDATE ON "ProductOption" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productoptionvalue_updated_at BEFORE UPDATE ON "ProductOptionValue" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productvariant_updated_at BEFORE UPDATE ON "ProductVariant" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bundleoffer_updated_at BEFORE UPDATE ON "BundleOffer" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planfeatureflags_updated_at BEFORE UPDATE ON "PlanFeatureFlags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_updated_at BEFORE UPDATE ON "Store" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paymentproof_updated_at BEFORE UPDATE ON "PaymentProof" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shippingoption_updated_at BEFORE UPDATE ON "ShippingOption" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipmentprovider_updated_at BEFORE UPDATE ON "ShipmentProvider" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daira_updated_at BEFORE UPDATE ON "Daira" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_baladiya_updated_at BEFORE UPDATE ON "Baladiya" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shippingconfig_updated_at BEFORE UPDATE ON "ShippingConfig" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketingintegration_updated_at BEFORE UPDATE ON "MarketingIntegration" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegrambot_updated_at BEFORE UPDATE ON "TelegramBot" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customdomain_updated_at BEFORE UPDATE ON "CustomDomain" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apppermission_updated_at BEFORE UPDATE ON "AppPermission" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== SUCCESS MESSAGE ====================
-- Schema created successfully! ✅
-- الآن يمكنك استخدام Prisma migrate أو تشغيل التطبيق مباشرة
