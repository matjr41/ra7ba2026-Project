import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import type { Express } from 'express';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private notification: NotificationService,
  ) {}

  // Get subscription plans
  getPlans() {
    return [
      {
        id: 'standard',
        name: 'Standard',
        nameAr: 'خطة قياسية',
        price: 1350,
        currency: 'DZD',
        interval: 'month',
        features: [
          'Unlimited products',
          'Unlimited orders',
          'Basic analytics',
          'Email support',
        ],
        featuresAr: [
          'منتجات غير محدودة',
          'طلبات غير محدودة',
          'تحليلات أساسية',
          'دعم عبر البريد الإلكتروني',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        nameAr: 'خطة احترافية',
        price: 2500,
        currency: 'DZD',
        interval: 'month',
        features: [
          'Everything in Standard',
          'Advanced analytics',
          'Priority support',
          'Custom domain',
          'API access',
        ],
        featuresAr: [
          'كل ميزات الخطة القياسية',
          'تحليلات متقدمة',
          'دعم ذو أولوية',
          'نطاق مخصص',
          'الوصول إلى API',
        ],
      },
    ];
  }

  // Get current subscription
  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tenant: {
          select: {
            status: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  // Submit payment (Upload proof for BaridiMob)
  async submitPayment(
    tenantId: string,
    data: {
      plan: SubscriptionPlan | string;
      paymentProof?: string;
      payerEmail?: string;
      baridimobRef?: string;
    },
    proofFile?: Express.Multer.File,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!data?.payerEmail || !data.payerEmail.trim()) {
      throw new BadRequestException('Payer email is required');
    }

    // Normalize plan value
    const normalizedPlan = typeof data.plan === 'string'
      ? (data.plan.toUpperCase() as SubscriptionPlan)
      : data.plan;
    if (!Object.values(SubscriptionPlan).includes(normalizedPlan as SubscriptionPlan)) {
      throw new BadRequestException('Invalid subscription plan');
    }

    let proofUrl = (data.paymentProof || '').trim();

    if (proofFile) {
      try {
        proofUrl = await this.storageService.uploadFile(proofFile, 'payments');
      } catch (error) {
        throw new BadRequestException('Failed to upload payment proof');
      }
    }

    if (!proofUrl) {
      throw new BadRequestException('Payment proof is required');
    }

    const amount = this.calculatePlanPrice(normalizedPlan as SubscriptionPlan);

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        subscription: { connect: { id: subscription.id } },
        amount,
        baridimobRef: data.baridimobRef,
        payerEmail: data.payerEmail.trim(),
        plan: normalizedPlan as SubscriptionPlan,
        paymentProof: proofUrl,
        status: PaymentStatus.PENDING,
      },
    });

    // Update subscription to pending payment
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: normalizedPlan as SubscriptionPlan,
        status: 'PENDING_PAYMENT',
      },
    });

    // Notify admin via Telegram (and DB notification)
    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
      await this.notification.notifyNewPayment(tenant?.name || tenantId, amount, normalizedPlan);
    } catch (e) {
      // log and continue
      // console.error('notifyNewPayment failed', e);
    }

    return {
      message: 'Payment submitted successfully. Waiting for admin approval.',
      messageAr: 'تم إرسال الدفع بنجاح. في انتظار موافقة المدير.',
      payment,
    };
  }

  // Get payment history
  async getPaymentHistory(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Calculate plan prices
  calculatePlanPrice(plan: SubscriptionPlan): number {
    const prices = {
      STANDARD: 1350,
      PRO: 2500,
    };
    return prices[plan];
  }
}
