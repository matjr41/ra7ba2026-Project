import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly UNIFIED_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''; // @ra7ba1_bot

  async sendOrderNotification(
    chatId: string,
    tenantName: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      wilaya: string;
      address: string;
      total: number;
      items: Array<{ productName: string; quantity: number; price: number }>;
    }
  ): Promise<boolean> {
    if (!this.UNIFIED_BOT_TOKEN || !chatId) {
      this.logger.warn('Telegram bot token or chat ID is missing');
      return false;
    }

    try {
      const itemsList = orderData.items
        .map(item => `  • ${item.productName} × ${item.quantity} - ${item.price} دج`)
        .join('\n');

      const message = `
🏪 **متجر: ${tenantName}**
🎉 **طلب جديد!** 

📦 رقم الطلب: \`${orderData.orderNumber}\`

👤 **معلومات العميل:**
• الاسم: ${orderData.customerName}
• الهاتف: ${orderData.customerPhone}
• الولاية: ${orderData.wilaya}
• العنوان: ${orderData.address}

🛒 **المنتجات:**
${itemsList}

💰 **المجموع:** ${orderData.total.toLocaleString()} دج

⏰ ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}

━━━━━━━━━━━━━━━━━━━━
🤖 @ra7ba1_bot - منصة رحبة
`;

      await axios.post(`https://api.telegram.org/bot${this.UNIFIED_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      this.logger.log(`Telegram notification sent for order ${orderData.orderNumber}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`);
      return false;
    }
  }

  async testConnection(chatId: string): Promise<boolean> {
    if (!this.UNIFIED_BOT_TOKEN) {
      this.logger.error('Unified bot token not configured');
      return false;
    }

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.UNIFIED_BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: '✅ اختبار الاتصال بنجاح!\n\n🤖 @ra7ba1_bot - البوت الموحد لمنصة رحبة\nTelegram Bot متصل ويعمل بشكل صحيح.',
        }
      );

      return response.data.ok;
    } catch (error: any) {
      this.logger.error(`Telegram connection test failed: ${error.message}`);
      return false;
    }
  }
}
