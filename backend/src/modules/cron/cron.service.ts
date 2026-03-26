import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { MerchantService } from '../merchant/merchant.service';
import { TenantStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class CronService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private merchantService: MerchantService,
  ) {}

  // Check trial expiry every day at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkTrialExpiry() {
    console.log('🔍 Checking trial expirations...');

    const now = new Date();

    // Find trials that have expired
    const expiredTrials = await this.prisma.tenant.findMany({
      where: {
        status: TenantStatus.TRIAL,
        trialEndsAt: {
          lte: now,
        },
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    // Suspend expired trials
    for (const tenant of expiredTrials) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: TenantStatus.EXPIRED },
      });

      console.log(`❌ Trial expired for: ${tenant.name}`);
    }

    // Find trials expiring in 2 days (warning)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const expiringTrials = await this.prisma.tenant.findMany({
      where: {
        status: TenantStatus.TRIAL,
        trialEndsAt: {
          gte: now,
          lte: twoDaysFromNow,
        },
      },
    });

    // Notify trials expiring soon
    for (const tenant of expiringTrials) {
      const daysLeft = Math.ceil(
        (tenant.trialEndsAt?.getTime() ?? 0 - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      
      await this.notificationService.notifyTrialExpiring(
        tenant.name,
        daysLeft,
      );
    }

    console.log(`✅ Checked ${expiredTrials.length} expired trials, ${expiringTrials.length} expiring soon`);
  }

  // Check subscription expiry every day at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkSubscriptionExpiry() {
    console.log('🔍 Checking subscription expirations...');

    const now = new Date();

    // Find subscriptions that have expired
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          lte: now,
        },
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    // Suspend tenants with expired subscriptions
    for (const subscription of expiredSubscriptions) {
      await this.prisma.$transaction([
        // Update subscription status
        this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED },
        }),
        // Suspend tenant
        this.prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { status: TenantStatus.SUSPENDED },
        }),
      ]);

      console.log(`❌ Subscription expired for: ${subscription.tenant.name}`);
    }

    console.log(`✅ Checked ${expiredSubscriptions.length} expired subscriptions`);
  }

  // Verify custom domains every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async verifyCustomDomains() {
    console.log('🔍 Verifying custom domains...');
    
    try {
      const result = await this.merchantService.verifyAllPendingDomains();
      console.log(`✅ Domain verification: ${result.verified} verified, ${result.errors} errors out of ${result.checked} checked`);
    } catch (error) {
      console.error('❌ Error in domain verification cron job:', error);
    }
  }
}
