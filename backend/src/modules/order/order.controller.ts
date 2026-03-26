import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser, TenantId } from '@/common/decorators/tenant.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  // Public: Create order (Customer checkout)
  @Post('checkout')
  @ApiOperation({ summary: 'Create order (Customer checkout)' })
  async checkout(@TenantId() tenantId: string, @Body() data: any) {
    return this.orderService.create(tenantId, data);
  }

  // Public: Track order
  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Track order by number (Public)' })
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.orderService.trackOrder(orderNumber);
  }

  // Merchant: Get all orders
  @Get('merchant')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get all orders (Merchant)' })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.orderService.findAll(user.tenant.id, query);
  }

  // Merchant: Get order by ID
  @Get('merchant/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get order by ID (Merchant)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderService.findOne(id, user.tenant.id);
  }

  // Merchant: Update order status
  @Patch('merchant/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update order status (Merchant)' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: { status: string; notes?: string },
  ) {
    return this.orderService.updateStatus(id, user.tenant.id, data.status as any, data.notes);
  }

  // Merchant: Assign delivery
  @Patch('merchant/:id/delivery')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Assign delivery company (Merchant)' })
  async assignDelivery(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: { deliveryCompany: string; trackingNumber?: string },
  ) {
    return this.orderService.assignDelivery(id, user.tenant.id, data);
  }
}
