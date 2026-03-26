import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products for tenant' })
  @Roles(UserRole.MERCHANT, UserRole.SUPER_ADMIN)
  async getAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenant?.id;
    return this.productsService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @Roles(UserRole.MERCHANT, UserRole.SUPER_ADMIN)
  async getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.tenant?.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @Roles(UserRole.MERCHANT)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user.tenant.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @Roles(UserRole.MERCHANT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, dto, user.tenant.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @Roles(UserRole.MERCHANT)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.delete(id, user.tenant.id);
  }
}
