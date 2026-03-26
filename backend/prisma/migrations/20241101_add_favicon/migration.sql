-- Add favicon column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN "favicon" TEXT;

-- Add comment
COMMENT ON COLUMN "Tenant"."favicon" IS 'Custom tab icon (favicon) URL for merchant store';
