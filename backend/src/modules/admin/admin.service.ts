import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { VercelService } from '@/common/services/vercel.service';
import { PaymentStatus, SubscriptionStatus, TenantStatus, SubscriptionPlan, CustomDomain } from '@prisma/client';
import { DomainListDto } from './dto/domain-approval.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private vercelService: VercelService,
  ) {}

  // Get all tenants with pagination
  async getAllTenants(page = 1, limit = 10, status?: TenantStatus) {
    // Ensure page and limit are valid numbers
    const validPage = Math.max(1, parseInt(String(page)) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 10));
    const skip = (validPage - 1) * validLimit;
    
    const where = status ? { status } : {};
    
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  // Delete active custom domain (admin action)
  async deleteDomain(tenantId: string) {
    const customDomain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (!customDomain) {
      throw new NotFoundException('لا يوجد دومين مخصص للحذف');
    }

    // إزالة من Vercel أولاً (إن وجد)
    await this.vercelService.removeDomain(customDomain.domain);

    // حذف من قاعدة البيانات
    await this.prisma.customDomain.delete({ where: { tenantId } });

    return { message: 'تم حذف الدومين المخصص نهائياً' };
  }

  // List all custom domains with verification status
  async listDomains(): Promise<DomainListDto[]> {
    const domains = await this.prisma.customDomain.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get verification status from Vercel for each domain
    const domainsWithStatus = await Promise.all(
      domains.map(async (domain) => {
        let status = 'pending';
        let error = null;
        
        if (domain.isVerified) {
          try {
            const vercelStatus = await this.vercelService.getDomainStatus(domain.domain);
            status = vercelStatus?.verified ? 'active' : 'pending_verification';
            error = vercelStatus?.error || null;
          } catch (e) {
            status = 'error';
            error = e.message;
          }
        }

        return {
          id: domain.id,
          domain: domain.domain,
          tenantId: domain.tenantId,
          tenantName: domain.tenant.name || domain.tenant.subdomain,
          isVerified: domain.isVerified,
          status,
          error: error || undefined,
          requestedAt: domain.createdAt.toISOString(),
          verifiedAt: domain.updatedAt > domain.createdAt ? domain.updatedAt.toISOString() : undefined,
        } as DomainListDto;
      })
    );

    return domainsWithStatus;
  }

  // Get pending payment approvals
  async getPendingPayments() {
    return this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: {
        subscription: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                subdomain: true,
                owner: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Approve payment
  async approvePayment(paymentId: string, adminId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: { tenant: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Calculate subscription period (1 month)
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Update payment, subscription, and tenant in transaction
    return this.prisma.$transaction(async (tx) => {
      // Approve payment
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      });

      // Update subscription
      await tx.subscription.update({
        where: { id: payment.subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

      // Update tenant status
      await tx.tenant.update({
        where: { id: payment.subscription.tenantId },
        data: {
          status: TenantStatus.ACTIVE,
        },
      });

      return { message: 'Payment approved successfully' };
    });
  }

  // Reject payment
  async rejectPayment(paymentId: string, adminId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return { message: 'Payment rejected' };
  }

  // Platform statistics
  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED } }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.APPROVED },
        _sum: { amount: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: { name: true, subdomain: true },
          },
        },
      }),
    ]);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        suspended: suspendedTenants,
      },
      orders: {
        total: totalOrders,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      recentOrders,
    };
  }

  // Suspend tenant
  async suspendTenant(tenantId: string, reason: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.SUSPENDED },
    });

    return { message: 'Tenant suspended successfully' };
  }

  // Activate tenant
  async activateTenant(tenantId: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.ACTIVE },
    });

    return { message: 'Tenant activated successfully' };
  }

  // Grant lifetime FREE subscription (no expiry)
  async grantFreeLifetime(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Upsert subscription to FREE/ACTIVE with no end date
      const existing = await tx.subscription.findUnique({ where: { tenantId } });
      if (existing) {
        await tx.subscription.update({
          where: { tenantId },
          data: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: null,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            tenantId,
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: null,
          },
        });
      }

      // Ensure tenant is ACTIVE
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.ACTIVE },
      });
    });

    return { message: 'Granted lifetime FREE subscription', tenantId };
  }

  // Ensure SUPER_ADMIN exists or reset its password
  async createOrResetAdminUser() {
    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'ra7baa1@gmail.com';
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'abdo154122!ChangeMe';

    const existing = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const hashed = await bcrypt.hash(defaultPassword, 10);

    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { password: hashed, isActive: true, email: existing.email || defaultEmail },
      });
      return { message: 'Admin password reset to default and activated', email: existing.email || defaultEmail };
    }

    const created = await this.prisma.user.create({
      data: {
        email: defaultEmail,
        password: hashed,
        name: 'Ra7ba Admin',
        phone: '+213555000000',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    return { message: 'Admin user created', email: created.email };
  }

  // Run feature schema fix (variants, bundles, plan flags, checkoutConfig)
  async applyFeatureSchemaFix() {
    // Try to ensure pgcrypto extension, but don't fail if unavailable on provider
    try {
      await this.prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    } catch (e) {
      // Non-fatal: extension not available on some managed Postgres
      // Proceed without it; we will seed via Prisma instead of SQL
      // console.warn('pgcrypto extension not enabled:', e);
    }

    // Detect Product.id column type to align FKs (uuid or text)
    const prodTypeRow: any = await this.prisma.$queryRawUnsafe(
      `SELECT format_type(a.atttypid, a.atttypmod) AS col_type
       FROM pg_attribute a
       JOIN pg_class c ON a.attrelid = c.oid
       JOIN pg_namespace n ON c.relnamespace = n.oid
       WHERE n.nspname = 'public' AND c.relname = 'Product' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped
       LIMIT 1;`
    );
    let productIdType = 'TEXT';
    if (Array.isArray(prodTypeRow) && prodTypeRow[0] && prodTypeRow[0].col_type) {
      const t = String(prodTypeRow[0].col_type).toLowerCase();
      if (t.includes('uuid')) productIdType = 'UUID';
      else if (t.includes('character varying') || t.includes('varchar') || t.includes('text')) productIdType = 'TEXT';
    }

    const sql = `
DO $$
BEGIN
    -- 1) Tenant.checkoutConfig JSON column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'checkoutConfig'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "checkoutConfig" JSONB;
        RAISE NOTICE 'Added column Tenant.checkoutConfig';
    END IF;

    -- 2) ProductOption table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductOption'
    ) THEN
        CREATE TABLE "ProductOption" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            name TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductOption';
    END IF;

    -- 3) ProductOptionValue table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductOptionValue'
    ) THEN
        CREATE TABLE "ProductOptionValue" (
            id TEXT PRIMARY KEY,
            "optionId" TEXT NOT NULL,
            value TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductOptionValue';
    END IF;

    -- 4) ProductVariant table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ProductVariant'
    ) THEN
        CREATE TABLE "ProductVariant" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            sku TEXT,
            barcode TEXT,
            price DECIMAL(10,2),
            stock INT,
            "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
            options JSONB NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table ProductVariant';
    END IF;

    -- 5) BundleOffer table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BundleOffer'
    ) THEN
        CREATE TABLE "BundleOffer" (
            id TEXT PRIMARY KEY,
            "productId" ${productIdType} NOT NULL,
            "minQuantity" INT NOT NULL,
            "bundlePrice" DECIMAL(10,2) NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table BundleOffer';
    END IF;

    -- 6) PlanFeatureFlags table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'PlanFeatureFlags'
    ) THEN
        CREATE TABLE "PlanFeatureFlags" (
            id TEXT PRIMARY KEY,
            plan "SubscriptionPlan" NOT NULL UNIQUE,
            "variantsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "quantityDiscountsEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "checkoutCustomizationEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        RAISE NOTICE 'Created table PlanFeatureFlags';
    END IF;

    -- 7) FKs and Indexes (create if missing)
    -- ProductOption.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductOption_productId_fkey'
    ) THEN
        ALTER TABLE "ProductOption"
            ADD CONSTRAINT "ProductOption_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- ProductOptionValue.optionId -> ProductOption.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductOptionValue_optionId_fkey'
    ) THEN
        ALTER TABLE "ProductOptionValue"
            ADD CONSTRAINT "ProductOptionValue_optionId_fkey"
            FOREIGN KEY ("optionId") REFERENCES "ProductOption"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- ProductVariant.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
    ) THEN
        ALTER TABLE "ProductVariant"
            ADD CONSTRAINT "ProductVariant_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- BundleOffer.productId -> Product.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BundleOffer_productId_fkey'
    ) THEN
        ALTER TABLE "BundleOffer"
            ADD CONSTRAINT "BundleOffer_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- indexes
    CREATE INDEX IF NOT EXISTS "ProductOption_productId_idx" ON "ProductOption"("productId");
    CREATE INDEX IF NOT EXISTS "ProductOptionValue_optionId_idx" ON "ProductOptionValue"("optionId");
    CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
    CREATE INDEX IF NOT EXISTS "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");
    CREATE INDEX IF NOT EXISTS "BundleOffer_productId_idx" ON "BundleOffer"("productId");
    CREATE INDEX IF NOT EXISTS "BundleOffer_isActive_idx" ON "BundleOffer"("isActive");

    -- 8) Ensure Setting.description exists (older DBs may miss this column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Setting' AND column_name = 'description'
    ) THEN
        ALTER TABLE "Setting" ADD COLUMN "description" TEXT;
        RAISE NOTICE 'Added column Setting.description';
    END IF;

END $$;`;

    await this.prisma.$executeRawUnsafe(sql);

    // Seed default feature flags safely using Prisma (no DB extensions required)
    try {
      const prismaAny: any = this.prisma as any;
      await prismaAny.planFeatureFlags.upsert({
        where: { plan: 'STANDARD' as any },
        update: {},
        create: {
          id: uuidv4(),
          plan: 'STANDARD' as any,
          variantsEnabled: false,
          quantityDiscountsEnabled: false,
          checkoutCustomizationEnabled: true,
        },
      });

      await prismaAny.planFeatureFlags.upsert({
        where: { plan: 'PRO' as any },
        update: {},
        create: {
          id: uuidv4(),
          plan: 'PRO' as any,
          variantsEnabled: true,
          quantityDiscountsEnabled: true,
          checkoutCustomizationEnabled: true,
        },
      });
    } catch (seedErr) {
      // Non-fatal if seeding fails
    }

    return { message: 'Feature schema fix applied successfully' };
  }

  // Verify that migrations/tables exist (used by GET /admin/tests/migrations)
  async checkMigrations() {
    const expectedTables = [
      'User',
      'RefreshToken',
      'Tenant',
      'Subscription',
      'Payment',
      'Category',
      'Product',
      'Order',
      'Wilaya',
      'Setting',
      'ProductOption',
      'ProductOptionValue',
      'ProductVariant',
      'BundleOffer',
      'PlanFeatureFlags',
      'Notification',
      // New SaaS additions
      'ShipmentProvider',
      'ShippingOption',
      'Daira',
      'Baladiya',
    ];

    const inList = expectedTables.map((t) => `'${t}'`).join(',');
    const rows: Array<{ table_name: string }> = await this.prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${inList});`
    );

    const found = new Set(rows.map((r) => r.table_name));
    const missing = expectedTables.filter((t) => !found.has(t));

    return {
      status: missing.length === 0 ? 'OK' : 'MISSING',
      missing,
      found: Array.from(found),
      checkedAt: new Date().toISOString(),
    };
  }

  // ==================== NEW ADMIN METHODS ====================

  // Get all products across all tenants
  async getAllProducts(filters: {
    search?: string;
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, tenantId, status, page, limit } = filters;
    const validPage = Math.max(1, parseInt(String(page ?? 1)) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit ?? 20)) || 20));
    const skip = (validPage - 1) * validLimit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tenantId && tenantId !== 'all') {
      where.tenantId = tenantId;
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
          category: {
            select: {
              name: true,
              nameAr: true,
            },
          },
        },
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  // Get all orders across all tenants
  async getAllOrders(filters: {
    search?: string;
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, tenantId, status, page, limit } = filters;
    const validPage = Math.max(1, parseInt(String(page ?? 1)) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit ?? 20)) || 20));
    const skip = (validPage - 1) * validLimit;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    if (tenantId && tenantId !== 'all') {
      where.tenantId = tenantId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(order => ({
        ...order,
        itemsCount: Array.isArray(order.items) ? order.items.length : 0,
      })),
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  // Get all users (merchants and customers)
  async getAllUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, role, status, page, limit } = filters;
    const validPage = Math.max(1, parseInt(String(page ?? 1)) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit ?? 20)) || 20));
    const skip = (validPage - 1) * validLimit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              status: true,
              _count: {
                select: {
                  products: true,
                  orders: true,
                },
              },
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(user => ({
        ...user,
        ordersCount: user._count.orders,
        productsCount: user.tenant?._count?.products || 0,
      })),
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  // Toggle user status
  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  // Delete product
  async deleteProduct(productId: string) {
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // Get reports and statistics
  async getReports(filters: { period?: string; reportType?: string }) {
    const { period = 'month', reportType = 'overview' } = filters;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get statistics
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      previousRevenue,
      previousOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.product.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate,
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate,
          },
        },
      }),
    ]);

    const revenue = Number(totalRevenue._sum.total || 0);
    const prevRevenue = Number(previousRevenue._sum.total || 1);
    const revenueChange = ((revenue - prevRevenue) / prevRevenue) * 100;
    const ordersChange = previousOrders > 0
      ? ((totalOrders - previousOrders) / previousOrders) * 100
      : 0;

    const stats = {
      totalRevenue: revenue,
      revenueChange: parseFloat(revenueChange.toFixed(2)),
      totalOrders,
      ordersChange: parseFloat(ordersChange.toFixed(2)),
      totalProducts,
      productsChange: 0,
      totalUsers,
      usersChange: 0,
    };

    // Get top merchants
    const topMerchants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    const merchantsWithRevenue = topMerchants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      orders: tenant._count.orders,
      revenue: tenant.orders.reduce((sum, order) => sum + Number(order.total), 0),
      growth: 0,
    }));

    // Get top products from orders.items JSON
    const allOrders = await this.prisma.order.findMany({
      select: { items: true },
    });
    
    const productStats = new Map<string, { name: string; sales: number; revenue: number }>();
    
    allOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const existing = productStats.get(item.productId) || { name: item.productName, sales: 0, revenue: 0 };
          existing.sales += item.quantity || 0;
          existing.revenue += item.subtotal || 0;
          productStats.set(item.productId, existing);
        });
      }
    });
    
    const topProductsFormatted = Array.from(productStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return {
      stats,
      topMerchants: merchantsWithRevenue,
      topProducts: topProductsFormatted,
    };
  }

  // Get plan features settings
  async getPlanFeatures() {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: ['plan_features_FREE', 'plan_features_STANDARD', 'plan_features_PRO'],
        },
      },
      select: { key: true, value: true },
    });

    const features: any = {
      FREE: {
        maxProducts: 50,
        maxOrders: 100,
        variants: false,
        bulkPricing: false,
        reviews: false,
        seasonalOffers: false,
        advancedSEO: false,
        multipleImages: 5,
        customDomain: false,
        prioritySupport: false,
      },
      STANDARD: {
        maxProducts: 200,
        maxOrders: 500,
        variants: true,
        bulkPricing: true,
        reviews: true,
        seasonalOffers: true,
        advancedSEO: true,
        multipleImages: 10,
        customDomain: false,
        prioritySupport: false,
      },
      PRO: {
        maxProducts: -1,
        maxOrders: -1,
        variants: true,
        bulkPricing: true,
        reviews: true,
        seasonalOffers: true,
        advancedSEO: true,
        multipleImages: 20,
        customDomain: true,
        prioritySupport: true,
      },
    };

    // Override with database settings if exist
    settings.forEach(setting => {
      const plan = setting.key.replace('plan_features_', '');
      if (features[plan]) {
        features[plan] = { ...features[plan], ...(setting.value as any) };
      }
    });

    return features;
  }

  // Update plan features
  async updatePlanFeatures(plan: string, featuresData: any) {
    const key = `plan_features_${plan}`;

    const existing = await this.prisma.setting.findUnique({ where: { key } });

    if (existing) {
      return this.prisma.setting.update({
        where: { key },
        data: { value: featuresData },
      });
    }

    return this.prisma.setting.create({
      data: {
        key,
        value: featuresData,
      },
    });
  }

  // ==================== CUSTOM DOMAIN MANAGEMENT ====================

  // Verify domain DNS records
  async verifyDomain(tenantId: string, domain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // تحقق من حالة الدومين عبر Vercel
    const vercelStatus = await this.vercelService.getDomainStatus(domain);

    const isVerified = !!vercelStatus?.verified;

    // قيم DNS المتوقعة (يمكن ضبطها من البيئة)
    const apexIp = process.env.VERCEL_ALIAS_IP || '76.76.21.21';
    const cnameTarget = process.env.VERCEL_CNAME_TARGET || 'cname.vercel-dns.com';

    return {
      domain,
      verified: isVerified,
      dnsRecords: [
        {
          type: 'A',
          name: '@',
          value: apexIp,
          status: isVerified ? 'verified' : 'pending',
        },
        {
          type: 'CNAME',
          name: 'www',
          value: cnameTarget,
          status: isVerified ? 'verified' : 'pending',
        },
      ],
    };
  }

  // Approve custom domain
  async approveDomain(tenantId: string, domain: string) {
    // لا نضيف الدومين إلى Vercel - يتم التعامل معه عبر DNS فقط
    console.log(`✅ Approving custom domain: ${domain} for tenant ${tenantId}`);
    console.log('⚠️ Domain will be resolved via middleware, not added to Vercel');

    // تحديث حالة الدومين في Database
    return this.prisma.customDomain.update({
      where: { tenantId },
      data: { 
        isVerified: true,
        sslEnabled: true,
      },
    });
  }

  // Reject custom domain
  async rejectDomain(tenantId: string, reason: string) {
    // الحصول على الدومين قبل الحذف
    const customDomain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (customDomain) {
      // حذف الدومين من Vercel إذا كان موجوداً
      await this.vercelService.removeDomain(customDomain.domain);
    }

    // حذف الدومين من Database
    return this.prisma.customDomain.delete({
      where: { tenantId },
    });
  }

  // Get all custom domain requests
  async getCustomDomainRequests() {
    return this.prisma.customDomain.findMany({
      where: {
        isVerified: false,
      },
      include: {
        tenant: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subscription: {
              select: {
                plan: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }
}

