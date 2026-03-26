import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.config.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: parseInt(this.config.get('EMAIL_PORT', '587'), 10),
      secure: this.config.get('EMAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get('EMAIL_USER'),
        pass: this.config.get('EMAIL_PASS'),
      },
    };

    // If email is not configured, use console logging for development
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.logger.warn('Email not configured. Using console logging for development.');
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendPasswordResetEmail(to: string, resetCode: string, userName: string) {
    const subject = 'إعادة تعيين كلمة المرور - منصة رحبة';
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background-color: #f3f4f6; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .code-box { background-color: #f9fafb; border: 2px dashed #8B5CF6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #8B5CF6; letter-spacing: 8px; font-family: monospace; }
          .warning { background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-center; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ منصة رحبة</h1>
            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">طلب إعادة تعيين كلمة المرور</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937;">مرحباً ${userName}،</h2>
            <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
              تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في منصة رحبة.
              استخدم الكود التالي لإتمام العملية:
            </p>
            
            <div class="code-box">
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">كود إعادة التعيين</p>
              <div class="code">${resetCode}</div>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 13px;">الكود صالح لمدة 15 دقيقة</p>
            </div>
            
            <div class="warning">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>تحذير:</strong> إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد أو التواصل معنا فوراً.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              شكراً لاستخدامك منصة رحبة 🎉
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© 2024 منصة رحبة - جميع الحقوق محفوظة</p>
            <p style="margin: 10px 0 0 0;">
              <a href="https://ra7ba.shop" style="color: #8B5CF6; text-decoration: none;">ra7ba.shop</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (!this.transporter) {
        // Development mode - log to console
        this.logger.log(`
========================================
📧 PASSWORD RESET EMAIL (DEV MODE)
========================================
To: ${to}
Subject: ${subject}
Reset Code: ${resetCode}
Valid for: 15 minutes
========================================
        `);
        return { success: true, mode: 'development' };
      }

      await this.transporter.sendMail({
        from: `"منصة رحبة" <${this.config.get('EMAIL_FROM', 'noreply@ra7ba.shop')}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Password reset email sent to ${to}`);
      return { success: true, mode: 'production' };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, userName: string, storeName: string) {
    const subject = 'مرحباً بك في منصة رحبة! 🎉';
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background-color: #f3f4f6; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: white; margin: 0;">🛍️ مرحباً بك في منصة رحبة!</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937;">عزيزي ${userName}،</h2>
            <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
              نرحب بك في منصة رحبة! تم إنشاء متجرك <strong>${storeName}</strong> بنجاح.
            </p>
            <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
              يمكنك الآن البدء في إضافة منتجاتك وإدارة متجرك بسهولة.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (!this.transporter) {
        this.logger.log(`Welcome email would be sent to ${to} (dev mode)`);
        return;
      }

      await this.transporter.sendMail({
        from: `"منصة رحبة" <${this.config.get('EMAIL_FROM', 'noreply@ra7ba.shop')}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
    }
  }
}
