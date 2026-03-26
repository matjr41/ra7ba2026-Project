import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { SuperAdminGuard } from '@/common/guards/super-admin.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/tenant.decorator';
import { DomainListDto } from './dto/domain-approval.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants (Super Admin only)' })
  async getAllTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllTenants(page, limit, status as any);
  }

  @Get('payments/pending')
  @ApiOperation({ summary: 'Get pending payment approvals' })
  async getPendingPayments() {
    return this.adminService.getPendingPayments();
  }

  @Post('payments/:id/approve')
  @ApiOperation({ summary: 'Approve payment' })
  async approvePayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.approvePayment(paymentId, user.id);
  }

  @Post('payments/:id/reject')
  @ApiOperation({ summary: 'Reject payment' })
  async rejectPayment(
    @Param('id') paymentId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.rejectPayment(paymentId, user.id, reason);
  }

  @Post('tenants/:id/grant-free-lifetime')
  @ApiOperation({ summary: 'Grant lifetime FREE plan to tenant (no expiry)' })
  async grantFreeLifetime(@Param('id') tenantId: string) {
    return this.adminService.grantFreeLifetime(tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('tests/migrations')
  @ApiOperation({ summary: 'Verify that migrations/tables exist' })
  async testMigrations() {
    return this.adminService.checkMigrations();
  }

  @Patch('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspend tenant' })
  async suspendTenant(
    @Param('id') tenantId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendTenant(tenantId, reason);
  }

  @Patch('tenants/:id/activate')
  @ApiOperation({ summary: 'Activate tenant' })
  async activateTenant(@Param('id') tenantId: string) {
    return this.adminService.activateTenant(tenantId);
  }

  @Post('maintenance/fix-features')
  @ApiOperation({ summary: 'Apply feature schema fix (Super Admin only)' })
  async applyFeatureSchemaFix() {
    return this.adminService.applyFeatureSchemaFix();
  }

  // ==================== NEW ADMIN ENDPOINTS ====================

  @Get('products')
  @ApiOperation({ summary: 'Get all products across all tenants' })
  async getAllProducts(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllProducts({
      search,
      tenantId,
      status,
      page,
      limit,
    });
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders across all tenants' })
  async getAllOrders(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllOrders({
      search,
      tenantId,
      status,
      page,
      limit,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (merchants and customers)' })
  async getAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllUsers({
      search,
      role,
      status,
      page,
      limit,
    });
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleUserStatus(@Param('id') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  @Post('products/:id/delete')
  @ApiOperation({ summary: 'Delete product' })
  async deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get platform reports and statistics' })
  async getReports(
    @Query('period') period?: string,
    @Query('reportType') reportType?: string,
  ) {
    return this.adminService.getReports({ period, reportType });
  }

  @Get('settings/plan-features')
  @ApiOperation({ summary: 'Get plan features settings' })
  async getPlanFeatures() {
    return this.adminService.getPlanFeatures();
  }

  @Patch('settings/plan-features')
  @ApiOperation({ summary: 'Update plan features' })
  async updatePlanFeatures(
    @Body('plan') plan: string,
    @Body('features') features: any,
  ) {
    return this.adminService.updatePlanFeatures(plan, features);
  }

  // ==================== CUSTOM DOMAIN MANAGEMENT ====================

  @Get('domains/requests')
  @ApiOperation({ summary: 'Get all custom domain requests' })
  async getCustomDomainRequests() {
    return this.adminService.getCustomDomainRequests();
  }

  @Post('domains/verify')
  @ApiOperation({ summary: 'Verify domain DNS records' })
  async verifyDomain(
    @Body('tenantId') tenantId: string,
    @Body('domain') domain: string,
  ) {
    return this.adminService.verifyDomain(tenantId, domain);
  }

  @Post('domains/approve')
  @ApiOperation({ summary: 'Approve custom domain' })
  async approveDomain(
    @Body('tenantId') tenantId: string,
    @Body('domain') domain: string,
  ) {
    return this.adminService.approveDomain(tenantId, domain);
  }

  @Post('domains/reject')
  @ApiOperation({ summary: 'Reject custom domain' })
  async rejectDomain(
    @Body('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectDomain(tenantId, reason);
  }

  @Delete('domains/:tenantId')
  @ApiOperation({ summary: 'Delete active custom domain' })
  async deleteDomain(
    @Param('tenantId') tenantId: string,
  ) {
    return this.adminService.deleteDomain(tenantId);
  }

  @Get('domains')
  @ApiOperation({ summary: 'List all custom domains with verification status' })
  async listDomains(): Promise<DomainListDto[]> {
    return this.adminService.listDomains();
  }
}
