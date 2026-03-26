import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private telegramBotToken: string;
  private telegramChatId: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.telegramBotToken = this.config.get('TELEGRAM_BOT_TOKEN') || '';
    this.telegramChatId = this.config.get('TELEGRAM_ADMIN_CHAT_ID') || '';
  }

  // Send notification to admin (via Telegram)
  async notifyAdmin(title: string, message: string, data?: any) {
    // Save to database
    await this.prisma.notification.create({
      data: {
        type: 'admin',
        title,
        message,
        data: data || {},
      },
    });

    // Send via Telegram if configured
    if (this.telegramBotToken && this.telegramChatId) {
      await this.sendTelegram(title, message);
    }
  }

  // Send Telegram message
  private async sendTelegram(title: string, message: string) {
    try {
      const text = `🔔 *${title}*\n\n${message}`;
      
      await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text,
          parse_mode: 'Markdown',
        },
      );
    } catch (error) {
      console.error('Telegram notification failed:', error.message);
    }
  }

  // Send to a specific Telegram chat id (merchant)
  private async sendTelegramTo(chatId: string, title: string, message: string) {
    try {
      const text = `🆕 *${title}*\n\n${message}`;
      await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        },
      );
    } catch (error) {
      console.error('Telegram merchant notification failed:', error.message);
    }
  }

  // Notify new subscription payment
  async notifyNewPayment(tenantName: string, amount: number, plan: string) {
    await this.notifyAdmin(
      'New Payment Submission',
      `Tenant: ${tenantName}\nPlan: ${plan}\nAmount: ${amount} DZD\n\nPlease review and approve.`,
      { tenantName, amount, plan },
    );
  }

  // Notify trial expiring
  async notifyTrialExpiring(tenantName: string, daysLeft: number) {
    await this.notifyAdmin(
      'Trial Expiring',
      `Tenant: ${tenantName}\nDays left: ${daysLeft}`,
      { tenantName, daysLeft },
    );
  }

  // Notify merchant of a new order
  async notifyMerchantNewOrder(tenantId: string, order: {
    orderNumber: string;
    total: number;
    customerName: string;
    customerPhone: string;
  }) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { 
          name: true, 
          telegramChatId: true,
          subscription: { select: { status: true } },
        },
      });

      if (!tenant?.telegramChatId) return;
      if (tenant.subscription && tenant.subscription.status !== 'ACTIVE') return;

      const title = `طلب جديد ${order.orderNumber}`;
      const msg = `المتجر: ${tenant.name}\nالعميل: ${order.customerName} (${order.customerPhone})\nالمجموع: ${order.total} دج`;
      await this.sendTelegramTo(tenant.telegramChatId, title, msg);

      // Also notify admin briefly
      await this.notifyAdmin(
        'New Order',
        `Tenant: ${tenant.name}\nOrder: ${order.orderNumber}\nTotal: ${order.total} DZD`,
        { tenantId, orderNumber: order.orderNumber, total: order.total },
      );
    } catch (err) {
      console.error('Failed to notify merchant/admin of new order:', err);
    }
  }

  // Get unread notifications
  async getUnreadNotifications() {
    return this.prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
