import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VercelService {
  private readonly logger = new Logger(VercelService.name);
  private readonly vercelToken = process.env.VERCEL_TOKEN;
  private readonly projectId = process.env.VERCEL_PROJECT_ID;
  private readonly teamId = process.env.VERCEL_TEAM_ID;

  /**
   * إضافة دومين إلى Vercel Project
   */
  async addDomain(domain: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.vercelToken || !this.projectId) {
        this.logger.error('VERCEL_TOKEN أو VERCEL_PROJECT_ID غير مُعرفة في متغيرات البيئة');
        return { success: false, message: 'إعدادات Vercel ناقصة على الخادم' };
      }

      this.logger.log(`🌐 Adding domain to Vercel: ${domain}`);

      const base = `https://api.vercel.com/v10/projects/${this.projectId}/domains`;
      const url = this.teamId ? `${base}?teamId=${this.teamId}` : base;
      
      const addOne = async (name: string) => fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      // أضف الدومين الأساسي
      const resApex = await addOne(domain);
      if (!resApex.ok) {
        const err = await resApex.json().catch(() => ({}));
        const msg = err?.error?.message || JSON.stringify(err) || `HTTP ${resApex.status}`;
        this.logger.error(`❌ Failed to add apex domain: ${msg}`);
        // لو كان موجود مسبقاً، اعتبرها نجاحاً
        if (!(err?.error?.code === 'domain_already_in_use' || err?.error?.code === 'domain_conflict' || err?.error?.code === 'domain_already_exists')) {
          return { success: false, message: `فشل إضافة الدومين: ${msg}` };
        }
      }

      // أضف www.<domain> بشكل اختياري
      const www = domain.startsWith('www.') ? domain : `www.${domain}`;
      const resWww = await addOne(www);
      if (!resWww.ok) {
        const err = await resWww.json().catch(() => ({}));
        const code = err?.error?.code;
        if (!(code === 'domain_already_in_use' || code === 'domain_conflict' || code === 'domain_already_exists')) {
          this.logger.warn(`⚠️ Failed to add www domain: ${code || resWww.status}`);
        }
      }

      this.logger.log(`✅ Domain bound to Vercel project: ${domain}`);
      
      return {
        success: true,
        message: 'تم إضافة الدومين إلى Vercel بنجاح',
      };
    } catch (error) {
      this.logger.error(`❌ Error adding domain to Vercel: ${error.message}`);
      return {
        success: false,
        message: 'حدث خطأ أثناء إضافة الدومين إلى Vercel',
      };
    }
  }

  /**
   * حذف دومين من Vercel Project
   */
  async removeDomain(domain: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.vercelToken || !this.projectId) {
        this.logger.error('VERCEL_TOKEN أو VERCEL_PROJECT_ID غير مُعرفة في متغيرات البيئة');
        return { success: false, message: 'إعدادات Vercel ناقصة على الخادم' };
      }

      this.logger.log(`🗑️ Removing domain from Vercel: ${domain}`);

      const base = `https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}`;
      const url = this.teamId ? `${base}?teamId=${this.teamId}` : base;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`❌ Failed to remove domain from Vercel: ${JSON.stringify(error)}`);
        return {
          success: false,
          message: error.error?.message || 'فشل حذف الدومين من Vercel',
        };
      }

      this.logger.log(`✅ Domain removed from Vercel successfully: ${domain}`);
      
      return {
        success: true,
        message: 'تم حذف الدومين من Vercel بنجاح',
      };
    } catch (error) {
      this.logger.error(`❌ Error removing domain from Vercel: ${error.message}`);
      return {
        success: false,
        message: 'حدث خطأ أثناء حذف الدومين من Vercel',
      };
    }
  }

  /**
   * التحقق من حالة الدومين في Vercel
   */
  async getDomainStatus(domain: string): Promise<any> {
    try {
      if (!this.vercelToken || !this.projectId) {
        this.logger.warn('⚠️ Vercel credentials missing');
        this.logger.warn(`   VERCEL_TOKEN: ${this.vercelToken ? '✅ Set' : '❌ Missing'}`);
        this.logger.warn(`   VERCEL_PROJECT_ID: ${this.projectId ? '✅ Set' : '❌ Missing'}`);
        return null;
      }

      const base = `https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}`;
      const url = this.teamId ? `${base}?teamId=${this.teamId}` : base;
      
      this.logger.log(`🔍 Checking domain status for: ${domain}`);
      this.logger.log(`   API URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { message: errorText };
        }
        
        // رسائل أوضح حسب نوع الخطأ
        if (response.status === 404) {
          // Domain not found is expected if domain hasn't been added to Vercel yet
          this.logger.warn(`⚠️ Domain ${domain} not found in Vercel project ${this.projectId}`);
          this.logger.warn(`   This is normal if the domain hasn't been added to Vercel yet.`);
          return null;
        } else if (response.status === 401 || response.status === 403) {
          this.logger.error(`❌ Vercel API authentication failed (${response.status}):`, errorJson);
          this.logger.error(`   Please check VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables`);
        } else {
          this.logger.error(`❌ Vercel API error (${response.status}):`, errorJson);
          this.logger.error(`   Error: ${errorJson.message || errorText}`);
        }
        
        return null;
      }

      const data = await response.json();
      
      // Log the full response for debugging
      this.logger.log(`📊 Domain status response for ${domain}:`, JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      this.logger.error(`❌ Error getting domain status: ${error.message}`);
      if (error instanceof Error) {
        this.logger.error(`   Stack: ${error.stack}`);
      }
      return null;
    }
  }

  /**
   * الحصول على سجلات DNS المطلوبة من Vercel
   * Vercel يعطي تعليمات DNS بناءً على نوع الدومين
   */
  async getDnsRecords(domain: string): Promise<{ aRecord?: any; cnameRecord?: any; instructions?: string }> {
    try {
      // Vercel عادة يحتاج:
      // - A record للدومين الأساسي (apex domain) يشير إلى 76.76.21.21
      // - CNAME للـ www يشير إلى cname.vercel-dns.com
      // لكن يمكن أن يختلف حسب إعدادات Vercel
      
      const status = await this.getDomainStatus(domain);
      
      // إذا كان الدومين محقق (verified)، نرجع سجلات DNS الافتراضية
      // في الواقع، Vercel لا يعطي سجلات DNS مباشرة، لكن هذه هي السجلات المطلوبة عادة
      const dnsRecords: { aRecord?: any; cnameRecord?: any; instructions?: string } = {
        aRecord: {
          type: 'A',
          name: '@',
          value: '76.76.21.21',
          ttl: 3600,
          description: 'أضف سجل A في DNS provider الخاص بك',
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: 'cname.vercel-dns.com',
          ttl: 3600,
          description: 'أضف سجل CNAME للـ www في DNS provider الخاص بك',
        },
        instructions: 'بعد إضافة السجلات، قد يستغرق الأمر حتى 48 ساعة حتى يتم التحقق من الدومين تلقائياً.',
      };

      // إذا كان الدومين محقق، نضيف هذه المعلومات
      if (status?.verified) {
        dnsRecords.instructions = 'الدومين محقق بنجاح!';
      }

      return dnsRecords;
    } catch (error) {
      this.logger.error(`❌ Error getting DNS records: ${error.message}`);
      // نرجع السجلات الافتراضية حتى لو فشل الطلب
      return {
        aRecord: {
          type: 'A',
          name: '@',
          value: '76.76.21.21',
          ttl: 3600,
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: 'cname.vercel-dns.com',
          ttl: 3600,
        },
      };
    }
  }
}
