-- Create Category table if missing to match Prisma schema

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Category'
  ) THEN
    CREATE TABLE "Category" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "nameAr" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "description" TEXT,
      "image" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");
    CREATE INDEX IF NOT EXISTS "Category_tenantId_idx" ON "Category"("tenantId");

    ALTER TABLE "Category"
      ADD CONSTRAINT "Category_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
