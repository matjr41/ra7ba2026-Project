import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string, page = 1, limit = 50) {
    const validPage = Math.max(1, parseInt(String(page)) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 50));
    const skip = (validPage - 1) * validLimit;

    const where = tenantId ? { tenantId } : {};

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
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

  async findOne(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const product = await this.prisma.product.findFirst({ where });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto, tenantId: string) {
    const { category, variants, dimensions, tags, ...productData } = dto;
    
    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return this.prisma.product.create({
      data: {
        name: dto.name,
        nameAr: dto.nameAr || dto.name,
        slug,
        price: dto.price,
        tenantId,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        comparePrice: dto.compareAtPrice,
        stock: dto.stock,
        sku: dto.sku,
        images: dto.images || [],
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { category, ...updateData } = dto;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: 'Product deleted successfully' };
  }
}
