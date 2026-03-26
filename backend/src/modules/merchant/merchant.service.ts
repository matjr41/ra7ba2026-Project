import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { VercelService } from '@/common/services/vercel.service';
import { RenderDomainService } from '@/common/services/render-domain.service';
import { UpdateMarketingDto } from './dto/update-marketing.dto';
import { MarketingIntegrationResponseDto } from './dto/marketing-response.dto';
import * as fs from 'fs';
import * as path from 'path';

let cachedWilayaData: any[] | null = null;

function loadAlgeriaWilayaData(): any[] {
  if (cachedWilayaData) {
    return cachedWilayaData;
  }

  try {
    const filePath = path.resolve(__dirname, '../../../..', 'algeria-full.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    cachedWilayaData = JSON.parse(fileContent);
  } catch (error) {
    console.error('[MerchantService] فشل قراءة ملف الولايات:', error);
    cachedWilayaData = [];
  }

  return cachedWilayaData || [];
}

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private vercelService: VercelService,
    private renderDomainService: RenderDomainService,
  ) {}

  private async hasActiveSubscription(tenantId: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        status: true,
        trialEndsAt: true,
        subscription: { select: { status: true } },
      },
    });
    if (!tenant) return false;
    if (tenant.status === 'ACTIVE') return true;
    if (tenant.status === 'TRIAL') {
      if (!tenant.trialEndsAt) return true;
      return new Date() <= new Date(tenant.trialEndsAt);
    }
    return !!tenant.subscription && tenant.subscription.status === 'ACTIVE';
  }

  async assertActiveSubscription(tenantId: string) {
    const ok = await this.hasActiveSubscription(tenantId);
    if (!ok) {
      throw new ForbiddenException('تم إيقاف خدمات المتجر لانتهاء الاشتراك');
    }
  }

  // Get merchant dashboard data
  async getDashboard(tenantId: string) {
    const [tenant, stats] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
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
      }),
      this.getStats(tenantId),
    ]);

    return {
      tenant,
      stats,
    };
  }

  // Get merchant statistics
  async getStats(tenantId: string) {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.count({ 
        where: { tenantId, status: 'PENDING' } 
      }),
      this.prisma.order.count({ 
        where: { tenantId, status: 'DELIVERED' } 
      }),
      this.prisma.order.aggregate({
        where: { 
          tenantId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
      },
      recentOrders,
    };
  }

  // Update store settings
  async updateStoreSettings(
    tenantId: string,
    data: {
      name?: string;
      nameAr?: string;
      description?: string;
      descriptionAr?: string;
      logo?: string;
      banner?: string;
      favicon?: string;
      phone?: string;
      address?: string;
      theme?: any;
      telegramChatId?: string;
      checkoutConfig?: any;
      storeFeatures?: any;
      thankYouMessage?: string;
      thankYouImage?: string;
    },
  ) {
    await this.assertActiveSubscription(tenantId);
    console.log('🔄 Updating store settings for tenant:', tenantId);
    console.log('📦 Data received:', JSON.stringify(data, null, 2));

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        logo: data.logo,
        banner: data.banner,
        favicon: data.favicon,
        phone: data.phone,
        address: data.address,
        theme: data.theme,
        telegramChatId: data.telegramChatId,
        checkoutConfig: data.checkoutConfig,
        storeFeatures: data.storeFeatures,
        thankYouMessage: data.thankYouMessage,
        thankYouImage: data.thankYouImage,
      },
    });

    console.log('✅ Store updated successfully:', updated.id);
    return updated;
  }

  // Check trial limits
  async checkTrialLimits(tenantId: string): Promise<{
    canAddProduct: boolean;
    canAddOrder: boolean;
    reason?: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        status: true,
        orderCount: true,
        productCount: true,
        trialEndsAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // If not in trial, no limits
    if (tenant.status !== 'TRIAL') {
      return { canAddProduct: true, canAddOrder: true };
    }

    // Check trial expiry
    if (tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
      return {
        canAddProduct: false,
        canAddOrder: false,
        reason: 'Trial period has expired',
      };
    }

    // Check limits
    const canAddProduct = tenant.productCount < 10;
    const canAddOrder = tenant.orderCount < 20;

    return {
      canAddProduct,
      canAddOrder,
      reason: !canAddProduct ? 'Trial product limit reached (10 max)' : 
              !canAddOrder ? 'Trial order limit reached (20 max)' : undefined,
    };
  }

  // Increment product count (for trial)
  async incrementProductCount(tenantId: string) {
    await this.assertActiveSubscription(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { productCount: { increment: 1 } },
    });
  }

  // Increment order count (for trial)
  async incrementOrderCount(tenantId: string) {
    await this.assertActiveSubscription(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { orderCount: { increment: 1 } },
    });
  }

  // ==================== MARKETING INTEGRATIONS ====================

  async getMarketingIntegration(tenantId: string): Promise<MarketingIntegrationResponseDto> {
    const integration = await this.prisma.marketingIntegration.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId },
    });

    return {
      facebookPixelId: integration.facebookPixelId ?? undefined,
      facebookEnabled: integration.facebookEnabled,
      tiktokPixelId: integration.tiktokPixelId ?? undefined,
      tiktokEnabled: integration.tiktokEnabled,
      googleAnalyticsId: integration.googleAnalyticsId ?? undefined,
      googleSheetsId: integration.googleSheetsId ?? undefined,
      googleEnabled: integration.googleEnabled,
      snapchatPixelId: integration.snapchatPixelId ?? undefined,
      snapchatEnabled: integration.snapchatEnabled,
      updatedAt: integration.updatedAt,
    };
  }

  async updateMarketingIntegration(
    tenantId: string,
    data: UpdateMarketingDto,
  ): Promise<MarketingIntegrationResponseDto> {
    await this.assertActiveSubscription(tenantId);
    const integration = await this.prisma.marketingIntegration.upsert({
      where: { tenantId },
      update: {
        facebookPixelId: data.facebookPixelId,
        facebookAccessToken: data.facebookAccessToken,
        facebookEnabled: data.facebookEnabled,
        tiktokPixelId: data.tiktokPixelId,
        tiktokAccessToken: data.tiktokAccessToken,
        tiktokEnabled: data.tiktokEnabled,
        googleAnalyticsId: data.googleAnalyticsId,
        googleSheetsId: data.googleSheetsId,
        googleServiceAccount: data.googleServiceAccount,
        googleEnabled: data.googleEnabled,
        snapchatPixelId: data.snapchatPixelId,
        snapchatEnabled: data.snapchatEnabled,
      },
      create: {
        tenantId,
        facebookPixelId: data.facebookPixelId,
        facebookAccessToken: data.facebookAccessToken,
        facebookEnabled: data.facebookEnabled ?? false,
        tiktokPixelId: data.tiktokPixelId,
        tiktokAccessToken: data.tiktokAccessToken,
        tiktokEnabled: data.tiktokEnabled ?? false,
        googleAnalyticsId: data.googleAnalyticsId,
        googleSheetsId: data.googleSheetsId,
        googleServiceAccount: data.googleServiceAccount,
        googleEnabled: data.googleEnabled ?? false,
        snapchatPixelId: data.snapchatPixelId,
        snapchatEnabled: data.snapchatEnabled ?? false,
      },
    });

    return {
      facebookPixelId: integration.facebookPixelId ?? undefined,
      facebookEnabled: integration.facebookEnabled,
      tiktokPixelId: integration.tiktokPixelId ?? undefined,
      tiktokEnabled: integration.tiktokEnabled,
      googleAnalyticsId: integration.googleAnalyticsId ?? undefined,
      googleSheetsId: integration.googleSheetsId ?? undefined,
      googleEnabled: integration.googleEnabled,
      snapchatPixelId: integration.snapchatPixelId ?? undefined,
      snapchatEnabled: integration.snapchatEnabled,
      updatedAt: integration.updatedAt,
    };
  }

  // ==================== PRODUCTS CRUD ====================

  // Get all products for tenant
  async getProducts(tenantId: string, filters?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, isActive, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Parse JSON fields
    const parsedProducts = products.map(product => ({
      ...product,
      images: this.parseJsonField(product.images),
      bulkPricing: this.parseJsonField(product.bulkPricing),
      badges: this.parseJsonField(product.badges),
      relatedProducts: this.parseJsonField(product.relatedProducts),
      crossSellProducts: this.parseJsonField(product.crossSellProducts),
    }));

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
  async getProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Parse JSON fields
    return {
      ...product,
      images: this.parseJsonField(product.images),
      bulkPricing: this.parseJsonField(product.bulkPricing),
      badges: this.parseJsonField(product.badges),
      relatedProducts: this.parseJsonField(product.relatedProducts),
      crossSellProducts: this.parseJsonField(product.crossSellProducts),
    };
  }

  // Create product
  async createProduct(tenantId: string, data: any) {
    await this.assertActiveSubscription(tenantId);
    // Check trial limits
    const limits = await this.checkTrialLimits(tenantId);
    if (!limits.canAddProduct) {
      throw new ForbiddenException(limits.reason);
    }

    // Generate unique slug
    if (!data.slug) {
      data.slug = await this.generateUniqueSlug(tenantId, data.name);
    } else {
      // Ensure provided slug is unique
      data.slug = await this.generateUniqueSlug(tenantId, data.slug);
    }

    const product = await this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        category: true,
      },
    });

    // Increment product count
    await this.incrementProductCount(tenantId);

    return product;
  }

  // Update product
  async updateProduct(tenantId: string, productId: string, data: any) {
    await this.assertActiveSubscription(tenantId);
    // Verify ownership
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: true,
      },
    });
  }

  // Delete product
  async deleteProduct(tenantId: string, productId: string) {
    await this.assertActiveSubscription(tenantId);
    // Verify ownership
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Decrement product count
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { productCount: { decrement: 1 } },
    });

    return { message: 'Product deleted successfully' };
  }

  // Duplicate product
  async duplicateProduct(tenantId: string, productId: string) {
    await this.assertActiveSubscription(tenantId);
    const original = await this.getProduct(tenantId, productId);

    const { id, createdAt, updatedAt, ...productData } = original as any;

    return this.createProduct(tenantId, {
      ...productData,
      name: `${productData.name} (نسخة)`,
      nameAr: `${productData.nameAr} (نسخة)`,
      slug: `${productData.slug}-copy-${Date.now()}`,
      isActive: false,
    });
  }

  // ==================== CATEGORIES ====================

  // Get all categories for tenant
  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single category
  async getCategory(tenantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Create category
  async createCategory(tenantId: string, data: any) {
    await this.assertActiveSubscription(tenantId);
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }

    return this.prisma.category.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  // Update category
  async updateCategory(tenantId: string, categoryId: string, data: any) {
    await this.assertActiveSubscription(tenantId);
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  // Delete category
  async deleteCategory(tenantId: string, categoryId: string) {
    await this.assertActiveSubscription(tenantId);
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing._count.products > 0) {
      throw new ForbiddenException('Cannot delete category with products. Move or delete products first.');
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  // ==================== ORDERS MANAGEMENT ====================

  // Get all orders for tenant
  async getOrders(tenantId: string, filters?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single order
  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Update order
  async updateOrder(tenantId: string, orderId: string, data: any) {
    await this.assertActiveSubscription(tenantId);
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  // Helper: Generate slug
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper: Generate unique slug
  private async generateUniqueSlug(tenantId: string, text: string): Promise<string> {
    let slug = this.generateSlug(text);
    let counter = 1;
    
    // Check if slug exists
    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: {
          tenantId,
          slug,
        },
      });
      
      if (!existing) {
        return slug;
      }
      
      // Add counter to make it unique
      slug = `${this.generateSlug(text)}-${counter}`;
      counter++;
    }
  }

  // ==================== SHIPPING CONFIG ====================

  private buildDefaultShippingConfig() {
    return {
      enableHomeDelivery: true,
      enableDeskDelivery: true,
      defaultHomeDeliveryPrice: 0,
      defaultDeskDeliveryPrice: 0,
      wilayas: this.getDefaultWilayas(),
      shippingCompanies: this.getDefaultShippingCompanies(),
    };
  }

  async getShippingConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { shippingConfig: true },
    });

    if (!tenant) {
      throw new NotFoundException('المتجر غير موجود');
    }

    const rawConfig = tenant.shippingConfig ? (tenant.shippingConfig as any) : undefined;
    return this.normalizeShippingConfig(rawConfig);
  }

  async updateShippingConfig(tenantId: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { shippingConfig: true },
    });

    if (!tenant) {
      throw new NotFoundException('المتجر غير موجود');
    }

    const currentConfig = this.normalizeShippingConfig(tenant.shippingConfig as any);
    const mergedConfig = {
      ...currentConfig,
      ...data,
      wilayas: data?.wilayas ?? currentConfig.wilayas,
      shippingCompanies: data?.shippingCompanies ?? currentConfig.shippingCompanies,
    };

    const normalizedConfig = this.normalizeShippingConfig(mergedConfig);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { shippingConfig: normalizedConfig },
    });

    return normalizedConfig;
  }

  private getDefaultWilayas() {
    const data = loadAlgeriaWilayaData();

    if (!data.length) {
      const fallbackWilayas = [
        'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
        'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
        'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
        'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
        'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي',
        'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت',
        'غرداية', 'غليزان', 'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس',
        'عين صالح', 'عين قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة',
      ];

      return fallbackWilayas.map((name, index) => ({
        wilayaCode: String(index + 1).padStart(2, '0'),
        wilayaName: name,
        communes: [],
        homeDeliveryPrice: 0,
        deskDeliveryPrice: 0,
        freeShipping: false,
        isActive: true,
      }));
    }

    return data.map((wilaya: any, index: number) => {
      const codeNumber = Number.isFinite(Number(wilaya?.id)) ? Number(wilaya.id) : index + 1;

      return {
        wilayaCode: String(codeNumber).padStart(2, '0'),
        wilayaName: wilaya?.nameAr || wilaya?.name || '',
        communes: Array.isArray(wilaya?.communes)
          ? wilaya.communes.map((commune: any) => ({
              id: commune?.id ? String(commune.id) : commune?.nameAr || commune?.name || '',
              name: commune?.nameAr || commune?.name || '',
              postalCode: commune?.postalCode || undefined,
            }))
          : [],
        homeDeliveryPrice: 0,
        deskDeliveryPrice: 0,
        freeShipping: false,
        isActive: true,
      };
    });
  }

  private normalizeShippingConfig(raw: any) {
    const defaultConfig = this.buildDefaultShippingConfig();
    const existingWilayas = Array.isArray(raw?.wilayas) ? raw.wilayas : [];

    const normalizedWilayas = defaultConfig.wilayas.map((defaultWilaya) => {
      const existing = existingWilayas.find(
        (w: any) =>
          w?.wilayaCode === defaultWilaya.wilayaCode ||
          (w?.wilayaName && w.wilayaName === defaultWilaya.wilayaName),
      );

      const freeShipping =
        typeof existing?.freeShipping === 'boolean' ? existing.freeShipping : defaultWilaya.freeShipping;

      const homeDeliveryPrice = this.toNumberOrUndefined(existing?.homeDeliveryPrice);
      const deskDeliveryPrice = this.toNumberOrUndefined(existing?.deskDeliveryPrice);

      return {
        ...defaultWilaya,
        homeDeliveryPrice: freeShipping
          ? 0
          : homeDeliveryPrice ?? defaultWilaya.homeDeliveryPrice,
        deskDeliveryPrice: freeShipping
          ? 0
          : deskDeliveryPrice ?? defaultWilaya.deskDeliveryPrice,
        freeShipping,
        isActive:
          typeof existing?.isActive === 'boolean' ? existing.isActive : defaultWilaya.isActive,
        communes:
          Array.isArray(existing?.communes) && existing.communes.length > 0
            ? existing.communes.map((commune: any) => ({
                id: commune?.id ? String(commune.id) : commune?.name || '',
                name: commune?.name || commune?.nameAr || '',
                postalCode: commune?.postalCode || undefined,
              }))
            : defaultWilaya.communes,
      };
    });

    return {
      enableHomeDelivery:
        typeof raw?.enableHomeDelivery === 'boolean'
          ? raw.enableHomeDelivery
          : defaultConfig.enableHomeDelivery,
      enableDeskDelivery:
        typeof raw?.enableDeskDelivery === 'boolean'
          ? raw.enableDeskDelivery
          : defaultConfig.enableDeskDelivery,
      defaultHomeDeliveryPrice: this.toNumberOrZero(raw?.defaultHomeDeliveryPrice),
      defaultDeskDeliveryPrice: this.toNumberOrZero(raw?.defaultDeskDeliveryPrice),
      shippingCompanies: Array.isArray(raw?.shippingCompanies)
        ? raw.shippingCompanies
        : defaultConfig.shippingCompanies,
      wilayas: normalizedWilayas,
    };
  }

  private toNumberOrUndefined(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  private toNumberOrZero(value: any): number {
    const num = this.toNumberOrUndefined(value);
    return num !== undefined ? num : 0;
  }

  private getDefaultShippingCompanies() {
    return [
      { id: '1', name: 'ياليدين', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '2', name: 'ZR Express', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '3', name: 'Jet Express', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '4', name: 'شركة 4', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '5', name: 'شركة 5', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '6', name: 'شركة 6', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '7', name: 'شركة 7', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '8', name: 'شركة 8', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '9', name: 'شركة 9', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
      { id: '10', name: 'شركة 10', apiKey: '', apiSecret: '', webhookUrl: '', isActive: false, notes: '' },
    ];
  }

  // ==================== INTEGRATIONS ====================

  async getIntegrations(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { integrations: true },
    });

    if (!tenant) {
      throw new NotFoundException('المتجر غير موجود');
    }

    const defaultIntegrations = {
      telegram: {
        enabled: false,
        botToken: '',
        chatId: '',
      },
      facebookPixel: {
        enabled: false,
        pixelId: '',
      },
      tiktokPixel: {
        enabled: false,
        pixelId: '',
      },
      googleSheets: {
        enabled: false,
        sheetId: '',
        serviceAccountEmail: '',
      },
    };

    // Parse JSON field
    const integrations = tenant.integrations
      ? (tenant.integrations as any)
      : defaultIntegrations;
    
    return integrations;
  }

  async updateIntegrations(tenantId: string, data: any) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { integrations: data },
      select: { integrations: true },
    });

    return updated.integrations;
  }

  // ==================== CUSTOM DOMAIN ====================

  async getCustomDomain(tenantId: string) {
    const domain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (!domain) {
      return null;
    }

    return {
      domain: domain.domain,
      isVerified: domain.isVerified,
      sslEnabled: domain.sslEnabled,
      dnsRecords: domain.dnsRecords,
      createdAt: domain.createdAt,
    };
  }

  async requestCustomDomain(tenantId: string, domain: string) {
    // التحقق من صحة الدومين
    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainPattern.test(domain)) {
      throw new BadRequestException('الدومين غير صحيح');
    }

    // تطبيع الدومين (إزالة www)
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // التحقق من أن الدومين غير مستخدم
    const existing = await this.prisma.customDomain.findUnique({
      where: { domain: normalizedDomain },
    });

    if (existing) {
      throw new BadRequestException('هذا الدومين مستخدم بالفعل');
    }

    // التحقق من الخطة
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscription: { select: { plan: true } } },
    });

    if (!tenant || tenant.subscription?.plan === 'FREE') {
      throw new BadRequestException('الدومين المخصص متاح فقط للخطة الاحترافية');
    }

    // سجلات DNS المرجعية - الدومين المخصص يجب أن يشير إلى المنصة الرئيسية (خادم Render)
    const renderServiceHostname = 'ra7ba-fr.onrender.com';
    const renderIp = '216.24.57.1';
    const platformDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'ra7ba.shop';
    const dnsRecords: any = {
      aRecord: {
        type: 'A',
        name: '@',
        value: renderIp,
        ttl: 300,
        description: `سجل A للدومين الرئيسي يشير إلى خادم Render لخدمة المنصة (${renderServiceHostname})`,
      },
      cnameRecord: {
        type: 'CNAME',
        name: 'www',
        value: renderServiceHostname,
        ttl: 300,
        description: 'سجل CNAME للـ www يشير إلى نفس الخدمة على Render',
      },
      instructions: `افتح إعدادات DNS في مزود الدومين (مثل Hostinger) وأضف:\n- سجل A باسم @ وقيمة ${renderIp}\n- سجل CNAME باسم www وقيمة ${renderServiceHostname}\nبعد الحفظ وانتشار DNS سيعمل الدومين المخصص تلقائياً على متجرك (${platformDomain}).`,
    };

    // إنشاء طلب الدومين في قاعدة البيانات فقط (بدون إضافة إلى Vercel)
    const customDomain = await this.prisma.customDomain.create({
      data: {
        tenantId,
        domain: normalizedDomain,
        isVerified: false,
        sslEnabled: false,
        dnsRecords,
      },
    });

    console.log(`✅ Custom domain request created: ${normalizedDomain} for tenant ${tenantId}`);
    console.log('⚠️ Domain NOT added to Vercel - will be resolved via middleware');

    return {
      message: 'تم إرسال طلب الدومين المخصص بنجاح! يرجى إضافة سجلات DNS المطلوبة في DNS provider الخاص بك.',
      domain: customDomain.domain,
      dnsRecords: customDomain.dnsRecords,
      isVerified: customDomain.isVerified,
      note: 'الدومين المخصص سيعمل تلقائياً بعد إضافة سجلات DNS. لا حاجة لإضافته إلى Vercel.',
    };
  }

  async deleteCustomDomain(tenantId: string) {
    const domain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (!domain) {
      throw new NotFoundException('لا يوجد دومين مخصص لحذفه');
    }

    // حاول إزالة الدومين من Render (إن تمت الموافقة عليه مسبقاً)
    try {
      await this.renderDomainService.removeDomain(domain.domain);
    } catch (e) {
      // تجاهل الخطأ حتى لا يمنع حذف السجل من قاعدة البيانات
    }

    await this.prisma.customDomain.delete({
      where: { tenantId },
    });

    return {
      message: 'تم حذف الدومين المخصص بنجاح',
    };
  }

  /**
   * تحديث حالة الدومين من Render
   */
  async refreshDomainStatus(tenantId: string) {
    const domain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (!domain) {
      throw new NotFoundException('لا يوجد دومين مخصص');
    }

    try {
      const status = await this.renderDomainService.getDomainStatus(domain.domain);
      
      if (!status) {
        console.error('❌ No status returned from Render for domain:', domain.domain);
        
        // Render لا يحتاج API keys
        let errorMessage = 'فشل الحصول على حالة الدومين من Render.';
        let debugInfo = 'No status from Render - manual check required';
        let shouldRetryAdd = false;
        
        // Render لا يحتاج API keys - نعطي تعليمات مباشرة
        errorMessage = 'الدومين يحتاج إضافة يدوية في Render Dashboard.';
        debugInfo = 'Manual setup required in Render';
        shouldRetryAdd = true;
        
        // محاولة إضافة الدومين إذا لم يكن موجوداً
        if (shouldRetryAdd) {
          try {
            console.log('🔄 Attempting to add domain to Render:', domain.domain);
            const addResult = await this.renderDomainService.addDomain(domain.domain);
            if (addResult.success) {
              console.log('✅ Domain instructions provided for Render successfully');
              // محاولة الحصول على الحالة مرة أخرى بعد الإضافة
              const newStatus = await this.renderDomainService.getDomainStatus(domain.domain);
              if (newStatus) {
                const verified = newStatus.verified === true;
                const sslEnabled = newStatus.sslEnabled === true;
                
                await this.prisma.customDomain.update({
                  where: { tenantId },
                  data: {
                    isVerified: verified,
                    sslEnabled: sslEnabled,
                  },
                });
                
                return {
                  message: 'تم إعطاء تعليمات الدومين لـ Render بنجاح! ' + (verified ? 'الدومين محقق ✅' : 'يرجى إضافة سجلات DNS'),
                  domain: domain.domain,
                  isVerified: verified,
                  sslEnabled: sslEnabled,
                  dnsRecords: domain.dnsRecords,
                };
              }
            } else {
              errorMessage = `فشل إعطاء تعليمات الدومين لـ Render: ${addResult.message}`;
            }
          } catch (addError) {
            console.error('❌ Error adding domain to Render:', addError);
            errorMessage = 'فشل إعطاء تعليمات الدومين لـ Render. يرجى المحاولة لاحقاً أو إضافته يدوياً من Render dashboard.';
          }
        }
        
        return {
          message: errorMessage,
          domain: domain.domain,
          isVerified: domain.isVerified,
          sslEnabled: domain.sslEnabled,
          dnsRecords: domain.dnsRecords,
          debug: debugInfo,
          suggestion: shouldRetryAdd 
            ? 'تمت محاولة إعطاء تعليمات الدومين. يرجى إضافته يدوياً من Render dashboard.'
            : 'تأكد من أن الدومين تم إضافته إلى Render service وأن DNS records صحيحة.',
        };
      }

      // Render لا يوفر API مثل Vercel
      // نستخدم الحالة الافتراضية
      const verified = status?.verified || false;
      
      // SSL status - Render يعالج SSL تلقائياً
      const sslEnabled = verified; // Render يوفر SSL تلقائياً للدومينات المخصصة

      console.log(`📊 Domain ${domain.domain} status:`, {
        verified,
        sslEnabled,
        rawStatus: status,
      });

      const updated = await this.prisma.customDomain.update({
        where: { tenantId },
        data: {
          isVerified: verified,
          sslEnabled: sslEnabled,
        },
      });

      return {
        message: verified 
          ? 'الدومين محقق بنجاح! ✅' 
          : 'الدومين لم يتم التحقق منه بعد. يرجى التحقق من إعدادات DNS. قد يستغرق الأمر حتى 48 ساعة.',
        domain: updated.domain,
        isVerified: updated.isVerified,
        sslEnabled: updated.sslEnabled,
        dnsRecords: updated.dnsRecords,
        renderStatus: status, // إرجاع الـ status الكامل للـ debugging
      };
    } catch (error) {
      console.error('❌ Error refreshing domain status:', error);
      throw new BadRequestException(`فشل تحديث حالة الدومين: ${error.message}`);
    }
  }

  /**
   * إعادة إضافة الدومين إلى Render إذا كان مفقوداً
   */
  async reAddDomainToRender(tenantId: string) {
    const domain = await this.prisma.customDomain.findUnique({
      where: { tenantId },
    });

    if (!domain) {
      throw new NotFoundException('لا يوجد دومين مخصص');
    }

    try {
      console.log('🔄 Re-adding domain to Render:', domain.domain);
      const addResult = await this.renderDomainService.addDomain(domain.domain);
      
      if (!addResult.success) {
        return {
          message: `فشل إضافة الدومين إلى Render: ${addResult.message}`,
          domain: domain.domain,
          success: false,
        };
      }

      // التحقق من الحالة بعد الإضافة
      const status = await this.renderDomainService.getDomainStatus(domain.domain);
      
      if (status) {
        const verified = status.verified === true;
        const sslEnabled = status.sslEnabled === true;

        await this.prisma.customDomain.update({
          where: { tenantId },
          data: {
            isVerified: verified,
            sslEnabled: sslEnabled,
          },
        });

        return {
          message: 'تم إعطاء تعليمات الدومين لـ Render بنجاح! ' + (verified ? 'الدومين محقق ✅' : 'يرجى إضافة سجلات DNS'),
          domain: domain.domain,
          isVerified: verified,
          sslEnabled: sslEnabled,
          success: true,
        };
      }

      return {
        message: 'تم إعطاء تعليمات الدومين لـ Render بنجاح! يرجى إضافة سجلات DNS',
        domain: domain.domain,
        isVerified: false,
        sslEnabled: false,
        success: true,
      };
    } catch (error) {
      console.error('❌ Error re-adding domain to Render:', error);
      throw new BadRequestException(`فشل إعطاء تعليمات الدومين لـ Render: ${error.message}`);
    }
  }

  /**
   * التحقق من جميع الدومينات غير المحققة
   * تستخدم من قبل cron job
   */
  async verifyAllPendingDomains() {
    const pendingDomains = await this.prisma.customDomain.findMany({
      where: {
        isVerified: false,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    let verifiedCount = 0;
    let errorCount = 0;

    for (const domain of pendingDomains) {
      try {
        const status = await this.renderDomainService.getDomainStatus(domain.domain);
        
        if (!status) {
          continue;
        }

        // نفس منطق التحقق من refreshDomainStatus
        const verified = status.verified === true;
        const sslEnabled = status.sslEnabled === true;

        if (verified) {
          await this.prisma.customDomain.update({
            where: { id: domain.id },
            data: {
              isVerified: true,
              sslEnabled: sslEnabled,
            },
          });
          verifiedCount++;
          console.log(`✅ Domain verified: ${domain.domain} for tenant ${domain.tenant.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error verifying domain ${domain.domain}:`, error);
      }
    }

    return {
      checked: pendingDomains.length,
      verified: verifiedCount,
      errors: errorCount,
    };
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
