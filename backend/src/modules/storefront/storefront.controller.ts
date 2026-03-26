import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorefrontService } from './storefront.service';

@ApiTags('storefront')
@Controller('store')
export class StorefrontController {
  constructor(private storefrontService: StorefrontService) {}

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve current host to store (custom domain or subdomain)' })
  async resolveStore(
    @Query('host') host?: string,
    @Headers('host') headerHost?: string,
    @Query('subdomain') subdomain?: string,
  ) {
    const finalHost = (host || headerHost || '').toString();
    return this.storefrontService.resolveStoreByHost(finalHost, subdomain);
  }

  @Get(':subdomain')
  @ApiOperation({ summary: 'Get store info' })
  async getStore(@Param('subdomain') subdomain: string) {
    return this.storefrontService.getStoreBySubdomain(subdomain);
  }

  @Get(':subdomain/products')
  @ApiOperation({ summary: 'Get store products' })
  async getProducts(
    @Param('subdomain') subdomain: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.storefrontService.getStoreProducts(subdomain, {
      search,
      categoryId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
    });
  }

  @Get(':subdomain/products/:slug')
  @ApiOperation({ summary: 'Get single product' })
  async getProduct(
    @Param('subdomain') subdomain: string,
    @Param('slug') slug: string,
  ) {
    return this.storefrontService.getProduct(subdomain, slug);
  }

  @Get(':subdomain/categories')
  @ApiOperation({ summary: 'Get store categories' })
  async getCategories(@Param('subdomain') subdomain: string) {
    return this.storefrontService.getStoreCategories(subdomain);
  }

  @Get(':subdomain/featured')
  @ApiOperation({ summary: 'Get featured products' })
  async getFeaturedProducts(@Param('subdomain') subdomain: string) {
    return this.storefrontService.getFeaturedProducts(subdomain);
  }

  @Post(':subdomain/orders')
  @ApiOperation({ summary: 'Create order' })
  async createOrder(
    @Param('subdomain') subdomain: string,
    @Body() orderData: any,
  ) {
    return this.storefrontService.createOrder(subdomain, orderData);
  }

  @Get('domain/:domain')
  @ApiOperation({ summary: 'Get tenant by custom domain' })
  async getTenantByDomain(@Param('domain') domain: string) {
    return this.storefrontService.getTenantByDomain(domain);
  }

  @Get('subdomain/:subdomain')
  @ApiOperation({ summary: 'Get tenant by subdomain' })
  async getTenantBySubdomain(@Param('subdomain') subdomain: string) {
    return this.storefrontService.getTenantBySubdomain(subdomain);
  }
}
