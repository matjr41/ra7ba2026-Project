import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TelegramService } from '@/common/services/telegram.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StorefrontService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  // Get tenant by custom domain
  async getTenantByDomain(domain: string) {
    const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
    
    const customDomain = await this.prisma.customDomain.findUnique({
      where: { domain: normalizedDomain },
      select: {
        tenantId: true,
        isVerified: true,
        tenant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            subdomain: true,
            status: true,
          },
        },
      },
    });

    if (!customDomain || !customDomain.isVerified) {
      return null;
    }

    return {
      tenantId: customDomain.tenantId,
      tenant: customDomain.tenant,
    };
  }

  // Get tenant by subdomain
  async getTenantBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        nameAr: true,
        subdomain: true,
        status: true,
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      tenantId: tenant.id,
      tenant,
    };
  }

  // Get store by subdomain
  async getStoreBySubdomain(subdomain: string) {
    const startTime = Date.now();
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        nameAr: true,
        subdomain: true,
        description: true,
        descriptionAr: true,
        logo: true,
        banner: true,
        favicon: true,
        phone: true,
        address: true,
        theme: true,
        storeFeatures: true,
        checkoutConfig: true,
        shippingConfig: true,
        integrations: true,
        thankYouMessage: true,
        thankYouImage: true,
        status: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    // Allow viewing store even if not ACTIVE; services like checkout will be gated elsewhere
    const defaultTheme = { mode: 'dark', fontFamily: 'inter', primaryColor: '#8B5CF6' } as any;
    const safeTenant = {
      ...tenant,
      theme:
        tenant.theme && typeof tenant.theme === 'object'
          ? { ...defaultTheme, ...tenant.theme }
          : defaultTheme,
    };

    console.log(`[getStoreBySubdomain] Completed in ${Date.now() - startTime}ms`);
    return safeTenant;
  }

  // Resolve store by Host header (custom domain or platform subdomain)
  async resolveStoreByHost(rawHost?: string | null, subdomainOverride?: string | null) {
    const startTime = Date.now();

    // If subdomain is explicitly provided (e.g. /store/[subdomain] on platform domain),
    // resolve directly via getStoreBySubdomain without relying on Host.
    const override = (subdomainOverride || '').trim();
    if (override) {
      console.log('🔍 [resolveStoreByHost] Using explicit subdomain override:', override);
      const store = await this.getStoreBySubdomain(override);
      console.log(`[resolveStoreByHost] Completed (override) in ${Date.now() - startTime}ms`);
      return {
        storeKey: store.subdomain || override,
        tenantId: store.id,
        store,
      };
    }

    const input = (rawHost || '').trim();
    if (!input) {
      throw new BadRequestException('Host header is required');
    }

    // Normalize host: remove port and leading www.
    const normalized = input
      .toLowerCase()
      .split(':')[0]
      .replace(/^www\./, '');

    console.log('🔍 [resolveStoreByHost] Incoming host:', input);
    console.log('🔍 [resolveStoreByHost] Normalized host:', normalized);

    // 1) Try to resolve via CustomDomain
    const custom = await this.prisma.customDomain.findFirst({
      where: { domain: normalized },
      include: {
        tenant: {
          select: {
            subdomain: true,
          },
        },
      },
    });

    let subdomain: string | null = null;

    if (custom?.tenant?.subdomain) {
      subdomain = custom.tenant.subdomain;
      console.log('✅ [resolveStoreByHost] Resolved via CustomDomain -> subdomain:', subdomain);
    } else {
      // 2) Fallback: treat host as <subdomain>.<root-domain>
      const parts = normalized.split('.');

      // For localhost development, keep behavior simple
      if (normalized.includes('localhost')) {
        if (parts.length > 1) {
          subdomain = parts[0];
        }
      } else if (parts.length >= 3) {
        // e.g. store.ra7ba.shop => store
        subdomain = parts[0];
      }

      console.log('🔍 [resolveStoreByHost] Fallback subdomain from host parts:', subdomain);
    }

    if (!subdomain) {
      console.log('❌ [resolveStoreByHost] No matching store for host:', normalized);
      throw new NotFoundException('Store not found');
    }

    const store = await this.getStoreBySubdomain(subdomain);

    console.log(`[resolveStoreByHost] Completed in ${Date.now() - startTime}ms`);
    return {
      storeKey: subdomain,
      tenantId: store.id,
      store,
    };
  }

  // Get store products
  async getStoreProducts(subdomain: string, filters?: {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const startTime = Date.now();
    const tenant = await this.getStoreBySubdomain(subdomain);
    const { search, categoryId, page = 1, limit = 20, sortBy = 'createdAt' } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.id,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orderBy: any = {};
    if (sortBy === 'price-asc') {
      orderBy.price = 'asc';
    } else if (sortBy === 'price-desc') {
      orderBy.price = 'desc';
    } else if (sortBy === 'name') {
      orderBy.name = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          nameAr: true,
          description: true,
          descriptionAr: true,
          price: true,
          comparePrice: true,
          images: true,
          slug: true,
          stock: true,
          isFeatured: true,
          freeShipping: true,
          category: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Parse JSON fields
    const parsedProducts = products.map(product => ({
      ...product,
      images: this.parseJsonField(product.images),
    }));

    console.log(`[getStoreProducts] Completed in ${Date.now() - startTime}ms`);
    return {
      data: parsedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single product
  async getProduct(subdomain: string, productSlug: string) {
    const startTime = Date.now();
    const tenant = await this.getStoreBySubdomain(subdomain);

    const product = await this.prisma.product.findFirst({
      where: {
        tenantId: tenant.id,
        slug: productSlug,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
        options: {
          include: { values: true },
          orderBy: { position: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment views counter
    await this.prisma.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } },
    });

    // Get related products
    const relatedProducts = await this.prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        images: true,
        slug: true,
      },
      take: 4,
    });

    // Parse JSON fields
    const parsedRelated = relatedProducts.map(p => ({
      ...p,
      images: this.parseJsonField(p.images),
    }));

    console.log(`[getProduct] Completed in ${Date.now() - startTime}ms`);
    return {
      ...product,
      images: this.parseJsonField(product.images),
      bulkPricing: this.parseJsonField(product.bulkPricing),
      badges: this.parseJsonField(product.badges),
      // Expose parsed variants/options for the storefront
      variants: (product as any)?.variants?.map((v: any) => ({
        ...v,
        options: this.parseJsonField(v?.options),
      })) || [],
      options: (product as any)?.options?.map((o: any) => ({
        ...o,
        values: o?.values || [],
      })) || [],
      relatedProducts: parsedRelated,
    };
  }

  // Get store categories
  async getStoreCategories(subdomain: string) {
    const tenant = await this.getStoreBySubdomain(subdomain);

    return this.prisma.category.findMany({
      where: {
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        image: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Get featured products
  async getFeaturedProducts(subdomain: string) {
    const tenant = await this.getStoreBySubdomain(subdomain);

    const products = await this.prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        isFeatured: true,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        comparePrice: true,
        images: true,
        slug: true,
        freeShipping: true,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    return products.map(product => ({
      ...product,
      images: this.parseJsonField(product.images),
    }));
  }

  private async hasActiveSubscription(tenantId: string): Promise<boolean> {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        status: true,
        subscription: { select: { status: true } },
      },
    });
    if (!t) return false;
    if (t.status === 'ACTIVE' || t.status === 'TRIAL') return true;
    return !!t.subscription && t.subscription.status === 'ACTIVE';
  }

  // Create order
  async createOrder(subdomain: string, orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    wilaya: string;
    daira?: string;
    commune: string;
    address: string;
    items: Array<{
      productId: string;
      quantity: number;
      selectedOptions?: Record<string, string>;
    }>;
    notes?: string;
  }) {
    const startTime = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('🛒 NEW ORDER REQUEST RECEIVED!');
    console.log('='.repeat(60));
    console.log(`📍 Subdomain: ${subdomain}`);
    console.log(`👤 Customer: ${orderData.customerName}`);
    console.log(`📞 Phone: ${orderData.customerPhone}`);
    console.log(`📍 Location: ${orderData.wilaya} - ${orderData.commune}`);
    console.log(`🛍️ Items: ${orderData.items.length} products`);
    console.log('='.repeat(60) + '\n');
    
    try {
      const tenant = await this.getStoreBySubdomain(subdomain);
      const canOrder = await this.hasActiveSubscription(tenant.id);
      if (!canOrder) {
        throw new ForbiddenException('تم إيقاف الطلبات لانتهاء الاشتراك');
      }
      console.log(`[createOrder] Tenant found in ${Date.now() - startTime}ms`);

      // Calculate order total
      const productIds = orderData.items.map(item => item.productId);
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          tenantId: tenant.id,
          isActive: true,
        },
      });
      console.log(`[createOrder] Products fetched in ${Date.now() - startTime}ms`);

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products not found or inactive');
      }

      // Check stock (only if tracking is enabled)
      for (const item of orderData.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        // Only check stock if inventory tracking is enabled
        if (product.trackInventory && product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.nameAr || product.name}`);
        }
      }

      // Calculate totals with Prisma Decimal
      let subtotal = new Prisma.Decimal(0);
      
      const orderItems = orderData.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const priceNum = Number(product?.price ?? 0);
        const price = new Prisma.Decimal(Number.isFinite(priceNum) ? priceNum : 0);
        const qtyNum = Number(item?.quantity ?? 0);
        const qty = Number.isFinite(qtyNum) ? qtyNum : 1;
        const itemSubtotal = price.mul(qty);
        subtotal = subtotal.add(itemSubtotal);

        // Get first image or null
        let productImage: string | null = null;
        if (product.images) {
          try {
            const imgs = typeof product.images === 'string'
              ? JSON.parse(product.images)
              : product.images;
            if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') {
              productImage = imgs[0];
            }
          } catch {
            productImage = null;
          }
        }

        return {
          productId: product.id,
          productName: product.name || 'منتج',
          productNameAr: product.nameAr || 'منتج',
          productImage: productImage,
          quantity: qty,
          price: price,
          subtotal: itemSubtotal,
        };
      });

      // Default shipping fee (can be customized per tenant later)
      const shippingFee = new Prisma.Decimal(600);
      const total = subtotal.add(shippingFee);

      // Validate Decimal values
      if (!subtotal.isFinite() || !shippingFee.isFinite() || !total.isFinite()) {
        console.warn('[createOrder] Invalid Decimal values detected! Aborting create.');
        console.warn('Subtotal:', subtotal.toString(), 'Shipping:', shippingFee.toString(), 'Total:', total.toString());
        throw new BadRequestException('Invalid order totals calculated');
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Debug: Log values
      console.log('[createOrder] Order items count:', orderItems.length);
      console.log('[createOrder] Subtotal:', subtotal.toNumber());
      console.log('[createOrder] Shipping:', shippingFee.toNumber());
      console.log('[createOrder] Total:', total.toNumber());
      
      // Build shippingAddress as JSON object (database expects JSONB)
      const shippingAddressJson = {
        wilaya: orderData.wilaya?.trim() || '',
        daira: orderData.daira?.trim() || '',
        commune: orderData.commune?.trim() || '',
        address: orderData.address?.trim() || '',
      };

      // Build items as JSON array (database expects JSONB)
      const itemsJson = orderItems.map((item, idx) => ({
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price.toNumber(),
        subtotal: item.subtotal.toNumber(),
        // Preserve selected options if provided by the client
        selectedOptions: (orderData.items?.[idx] as any)?.selectedOptions || {},
      }));

      // Build order payload
      const orderPayload: any = {
        orderNumber,
        tenantId: tenant.id,
        customerName: orderData.customerName?.trim() || 'عميل',
        customerPhone: orderData.customerPhone?.trim() || '',
        shippingAddress: shippingAddressJson,
        items: itemsJson,
        subtotal: subtotal.toNumber(),
        shippingCost: shippingFee.toNumber(),
        total: total.toNumber(),
      };
      
      // Add optional string fields if provided
      if (orderData.wilaya) orderPayload.wilaya = orderData.wilaya.trim();
      if (orderData.commune) orderPayload.commune = orderData.commune.trim();
      if (orderData.address) orderPayload.address = orderData.address.trim();
      if (orderData.customerEmail) orderPayload.customerEmail = orderData.customerEmail.trim();
      if (orderData.daira) orderPayload.daira = orderData.daira.trim();
      if (orderData.notes) orderPayload.notes = orderData.notes.trim();
      console.log('[createOrder] Payload:', JSON.stringify(orderPayload));

      // Inspect DB role and RLS flags for the Order table
      try {
        const rlsInfo: any[] = await this.prisma.$queryRawUnsafe(
          "SELECT current_user, session_user, (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS is_superuser, (SELECT relrowsecurity FROM pg_class WHERE relname = 'Order') AS rls_enabled, (SELECT relforcerowsecurity FROM pg_class WHERE relname = 'Order') AS rls_forced"
        );
        if (Array.isArray(rlsInfo) && rlsInfo.length > 0) {
          console.log('[createOrder] DB Role Info:', rlsInfo[0]);
        }
      } catch (e: any) {
        console.log('[createOrder] RLS info error:', e?.message || e);
      }

      // Use transaction for atomicity and parallel updates for speed
      const order = await this.prisma.$transaction(async (tx) => {
        // Create order with items in JSON
        console.log('[createOrder] About to create order...');
        const newOrder = await tx.order.create({
          data: orderPayload,
        });
        console.log('[createOrder] Order created successfully, id:', newOrder.id);

        // Parallel stock updates and order count increment
        const stockUpdates = orderData.items
          .map(item => {
            const product = products.find(p => p.id === item.productId);
            // Only decrement stock if tracking is enabled
            if (product?.trackInventory) {
              return tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
            return null;
          })
          .filter(Boolean);

        await Promise.all([
          ...stockUpdates,
          tx.tenant.update({
            where: { id: tenant.id },
            data: { orderCount: { increment: 1 } },
          }),
        ]);

        // Return the created order (items are already in JSON)
        return newOrder;
      }, {
        maxWait: 5000, // 5s max wait for transaction lock
        timeout: 8000, // 8s max transaction time
      });

      // إرسال إشعار Telegram (لا ننتظره حتى لا يبطئ الاستجابة)
      this.sendTelegramNotification(tenant, order).catch(err => {
        console.error('[createOrder] Telegram notification failed:', err.message);
      });

      console.log('\n' + '='.repeat(60));
      console.log('✅ ORDER CREATED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`📦 Order Number: ${order.orderNumber}`);
      console.log(`💰 Total: ${order.total} DZD`);
      console.log(`⏱️ Time: ${Date.now() - startTime}ms`);
      console.log('='.repeat(60) + '\n');
      return order;
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ ORDER CREATION FAILED!');
      console.log('='.repeat(60));
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.log('='.repeat(60) + '\n');
      throw error;
    }
  }

  // Send Telegram notification for new order
  private async sendTelegramNotification(tenant: any, order: any) {
    try {
      // Check if integrations exist and telegram is enabled
      if (!tenant.integrations) return;
      
      const integrations = typeof tenant.integrations === 'string' 
        ? JSON.parse(tenant.integrations) 
        : tenant.integrations;
      
      if (!integrations?.telegram?.enabled) return;
      if (!integrations.telegram.chatId) return;

      // Prepare order items for notification
      const items = order.items.map((item: any) => ({
        productName: item.productNameAr || item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      // Send notification using unified bot
      await this.telegramService.sendOrderNotification(
        integrations.telegram.chatId,
        tenant.nameAr || tenant.name,
        {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          wilaya: order.wilaya,
          address: order.address,
          total: order.total,
          items,
        }
      );
    } catch (error: any) {
      console.error('[sendTelegramNotification] Error:', error.message);
    }
  }

  // ==================== HELPER METHODS ====================

  private parseJsonField(field: any): any {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field;
  }
}

