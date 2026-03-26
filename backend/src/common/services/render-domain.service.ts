import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RenderDomainService {
  private readonly logger = new Logger(RenderDomainService.name);

  /**
   * إضافة دومين مخصص لـ Render (بشكل يدوي)
   * Render لا يدعم API لإضافة الدومينات، يجب إضافتها يدوياً
   */
  async addDomain(domain: string): Promise<{ success: boolean; message: string; instructions?: string }> {
    try {
      this.logger.log(`🌐 Custom domain instructions for Render: ${domain}`);

      // Render يعمل بشكل مختلف - نعطي تعليمات يدوية
      const instructions = `
📋 تعليمات إضافة دومين مخصص لـ Render:

1. اذهب إلى Render Dashboard
2. اختر Frontend Service
3. اذهب إلى Settings → Custom Domains
4. أضف الدومين: ${domain}
5. أضف www.${domain} (اختياري)
6. انتظر SSL Certificate (5-10 دقائق)

🔧 DNS Records المطلوبة:
- A record: ${domain} → 216.24.57.7
- أو CNAME: ${domain} → ra7ba-backend.onrender.com
- CNAME: www.${domain} → ra7ba-backend.onrender.com

⏰ بعد إضافة DNS Records، انتظر 5-30 دقيقة
✅ الدومين سيعمل تلقائياً بعد إتمام الخطوات
      `;

      this.logger.log(`✅ Domain instructions provided for: ${domain}`);
      
      return {
        success: true,
        message: 'تم إعطاء تعليمات إضافة الدومين لـ Render',
        instructions: instructions.trim(),
      };
    } catch (error) {
      this.logger.error(`❌ Error providing domain instructions: ${error.message}`);
      return {
        success: false,
        message: 'حدث خطأ أثناء إعطاء تعليمات الدومين',
      };
    }
  }

  /**
   * حذف دومين من Render (بشكل يدوي)
   */
  async removeDomain(domain: string): Promise<{ success: boolean; message: string; instructions?: string }> {
    try {
      this.logger.log(`🗑️ Remove domain instructions for Render: ${domain}`);

      const instructions = `
📋 تعليمات حذف دومين مخصص من Render:

1. اذهب إلى Render Dashboard
2. اختر Frontend Service (ra7ba-fr)
3. اذهب إلى Settings → Custom Domains
4. ابحث عن الدومين: ${domain}
5. اضغط على Delete
6. احذف DNS Records من DNS provider
      `;

      this.logger.log(`✅ Domain removal instructions provided for: ${domain}`);
      
      return {
        success: true,
        message: 'تم إعطاء تعليمات حذف الدومين من Render',
        instructions: instructions.trim(),
      };
    } catch (error) {
      this.logger.error(`❌ Error providing domain removal instructions: ${error.message}`);
      return {
        success: false,
        message: 'حدث خطأ أثناء إعطاء تعليمات حذف الدومين',
      };
    }
  }

  /**
   * تحقق من حالة الدومين المخصص
   */
  async getDomainStatus(domain: string): Promise<{ verified: boolean; sslEnabled: boolean; rawStatus: any }> {
    try {
      this.logger.log(`🔍 Checking domain status for: ${domain}`);

      // محاولة التحقق من SSL
      const https = require('https');
      
      return new Promise((resolve) => {
        const req = https.request({
          hostname: domain,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 5000,
        }, (res: any) => {
          const sslEnabled = res.socket?.encrypted || false;
          const verified = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
          
          this.logger.log(`📊 Domain ${domain} status: verified=${verified}, ssl=${sslEnabled}`);
          
          resolve({
            verified,
            sslEnabled,
            rawStatus: {
              verified,
              sslEnabled,
              statusCode: res.statusCode,
              message: verified ? 'Domain working correctly' : 'Domain not accessible',
            },
          });
        });

        req.on('error', () => {
          resolve({
            verified: false,
            sslEnabled: false,
            rawStatus: {
              verified: false,
              sslEnabled: false,
              message: 'Domain not accessible - check DNS and SSL',
            },
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            verified: false,
            sslEnabled: false,
            rawStatus: {
              verified: false,
              sslEnabled: false,
              message: 'Connection timeout - check DNS configuration',
            },
          });
        });

        req.end();
      });
    } catch (error) {
      this.logger.error(`❌ Error checking domain status: ${error.message}`);
      return {
        verified: false,
        sslEnabled: false,
        rawStatus: {
          verified: false,
          sslEnabled: false,
          message: 'Error checking domain status',
        },
      };
    }
  }

  /**
   * الحصول على سجلات DNS المطلوبة لـ Render
   */
  async getDnsRecords(domain: string): Promise<{ aRecord?: any; cnameRecord?: any; instructions?: string }> {
    try {
      this.logger.log(`📋 Getting DNS records for Render: ${domain}`);
      
      // Render DNS Records
      const dnsRecords = {
        aRecord: {
          type: 'A',
          name: '@',
          value: '216.24.57.7',
          ttl: 300,
          description: 'أضف سجل A في DNS provider الخاص بك',
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: 'ra7ba-backend.onrender.com',
          ttl: 300,
          description: 'أضف سجل CNAME للـ www في DNS provider الخاص بك',
        },
        instructions: `
🔧 DNS Records لـ Render:
1. A record: ${domain} → 216.24.57.7
2. CNAME record: www.${domain} → ra7ba-backend.onrender.com
3. انتظر 5-30 دقيقة للتحقق
4. أضف الدومين في Render Dashboard
        `.trim(),
      };

      return dnsRecords;
    } catch (error) {
      this.logger.error(`❌ Error getting DNS records: ${error.message}`);
      return {
        aRecord: {
          type: 'A',
          name: '@',
          value: '216.24.57.7',
          ttl: 300,
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: 'ra7ba-backend.onrender.com',
          ttl: 300,
        },
      };
    }
  }
}
