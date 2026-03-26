import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser, TenantId } from '@/common/decorators/tenant.decorator';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  // Merchant endpoints
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Create product (Merchant)' })
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.productService.create(user.tenant.id, data);
  }

  @Get('merchant')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get all products (Merchant)' })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.productService.findAll(user.tenant.id, query);
  }

  @Get('merchant/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get product by ID (Merchant)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.findOne(id, user.tenant.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update product (Merchant)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.productService.update(id, user.tenant.id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Delete product (Merchant)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.remove(id, user.tenant.id);
  }

  // Public storefront endpoints
  @Get('store')
  @ApiOperation({ summary: 'Get store products (Public)' })
  async getStoreProducts(@TenantId() tenantId: string, @Query() query: any) {
    return this.productService.getStoreProducts(tenantId, query);
  }

  @Get('store/:slug')
  @ApiOperation({ summary: 'Get product by slug (Public)' })
  async getBySlug(@Param('slug') slug: string, @TenantId() tenantId: string) {
    return this.productService.getBySlug(slug, tenantId);
  }
}
