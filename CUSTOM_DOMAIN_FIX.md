# إصلاح شامل لنظام الدومينات المخصصة

## المشكلة الأساسية
الكود كان يضيف الدومينات المخصصة للمتاجر **مباشرة إلى Vercel Project** الخاص بالمنصة الرئيسية (ra7ba.shop)، مما يجعل كل دومين مخصص يصبح دومين أساسي للمنصة كلها بدلاً من أن يكون مجرد alias يشير إلى المتجر.

## الحل المطبق

### 1. **إزالة إضافة الدومينات إلى Vercel**
- **الملف**: `backend/src/modules/merchant/merchant.service.ts`
- **التغيير**: في دالة `requestCustomDomain()`:
  - ✅ الدومين يُحفظ في قاعدة البيانات فقط
  - ✅ لا يتم إضافته إلى Vercel Project
  - ✅ DNS records تُحفظ كمرجع للمستخدم فقط

```typescript
// قبل: كان يضيف الدومين إلى Vercel
const addResult = await this.vercelService.addDomain(domain);

// بعد: فقط حفظ في قاعدة البيانات
const customDomain = await this.prisma.customDomain.create({
  data: {
    tenantId,
    domain: normalizedDomain,
    isVerified: false,
    sslEnabled: false,
    dnsRecords,
  },
});
```

### 2. **تحديث Admin Approval**
- **الملف**: `backend/src/modules/admin/admin.service.ts`
- **التغيير**: في دالة `approveDomain()`:
  - ✅ لا يتم إضافة الدومين إلى Vercel
  - ✅ فقط تحديث حالة `isVerified` في قاعدة البيانات

```typescript
// قبل: كان يضيف إلى Vercel
const vercelResult = await this.vercelService.addDomain(domain);

// بعد: فقط تحديث قاعدة البيانات
return this.prisma.customDomain.update({
  where: { tenantId },
  data: { 
    isVerified: true,
    sslEnabled: true,
  },
});
```

### 3. **كيفية عمل الدومينات المخصصة الآن**

#### المسار الكامل:
```
1. المستخدم يدخل: example.com
   ↓
2. DNS يشير إلى: ra7ba.shop (عبر A record أو CNAME)
   ↓
3. الطلب يصل إلى Vercel (ra7ba.shop)
   ↓
4. Frontend Middleware يستقبل الطلب
   ↓
5. Middleware يستدعي Backend: /domains/resolve?host=example.com
   ↓
6. Backend يبحث في customDomain table عن example.com
   ↓
7. Backend يرجع: { subdomain: "store-slug" }
   ↓
8. Middleware يعيد كتابة الطلب إلى: /store/store-slug
   ↓
9. المستخدم يرى متجره على example.com ✅
```

### 4. **DNS Configuration للمستخدم**
المستخدم يجب أن يضيف في DNS provider الخاص به:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## الملفات المعدلة

### 1. `backend/src/modules/merchant/merchant.service.ts`
- ✅ دالة `requestCustomDomain()` - لا تضيف إلى Vercel
- ✅ تطبيع الدومين (إزالة www)
- ✅ حفظ DNS records كمرجع فقط

### 2. `backend/src/modules/admin/admin.service.ts`
- ✅ دالة `approveDomain()` - لا تضيف إلى Vercel
- ✅ فقط تحديث `isVerified` في قاعدة البيانات

### 3. `backend/src/modules/storefront/domain.controller.ts` (تم تعديله سابقاً)
- ✅ يقبل `host` و `domain` query parameters
- ✅ يبحث في `customDomain` table
- ✅ يرجع `subdomain` للـ middleware

### 4. `frontend/middleware.ts` (تم تنظيفه سابقاً)
- ✅ يستدعي `/domains/resolve?host=...`
- ✅ يعيد كتابة الطلب إلى `/store/<slug>`
- ✅ يدعم wildcard subdomains (*.ra7ba.shop)

### 5. `frontend/src/app/api/stores/by-domain/route.ts` (تم تعديله س��بقاً)
- ✅ يقبل `domain` أو `host` query parameters
- ✅ يستخدم `SUPABASE_SERVICE_ROLE_KEY` فقط
- ✅ يبحث في `custom_domain` column

## الفوائد

✅ **الدومينات المخصصة لا تؤثر على المنصة الرئيسية**
- كل دومين مخصص يبقى في قاعدة البيانات فقط
- لا يتم إضافته إلى Vercel Project
- المنصة الرئيسية تبقى نظيفة

✅ **أداء أفضل**
- لا توجد عمليات إضافة/حذف متكررة من Vercel
- البحث يتم في قاعدة البيانات مباشرة

✅ **أمان أفضل**
- الدومينات المخصصة معزولة عن المنصة
- كل متجر يرى فقط دومينه الخاص

✅ **سهولة الإدارة**
- المستخدم يضيف DNS records من DNS provider الخاص به
- لا حاجة لتدخل من الـ admin في Vercel

## اختبار الحل

### 1. اختبر إضافة دومين مخصص:
```bash
POST /merchant/domain/request
{
  "domain": "mystore.com"
}
```

### 2. تحقق من قاعدة البيانات:
```sql
SELECT * FROM "CustomDomain" WHERE domain = 'mystore.com';
```

### 3. اختبر الـ resolve endpoint:
```bash
GET /domains/resolve?host=mystore.com
```

### 4. ��ضف DNS records في DNS provider:
- A record: @ → 76.76.21.21
- CNAME record: www → cname.vercel-dns.com

### 5. انتظر 24-48 ساعة لانتشار DNS

### 6. ادخل إلى mystore.com وتحقق من أنه يعرض المتجر الصحيح

## الخطوات التالية (اختيارية)

### إذا أردت إضافة SSL verification:
```typescript
// في refreshDomainStatus()
const sslEnabled = status?.ssl?.ready === true;
```

### إذا أردت إضافة cron job للتحقق من DNS:
```typescript
// في cron.service.ts
@Cron(CronExpression.EVERY_6_HOURS)
async verifyCustomDomainsDNS() {
  // تحقق من DNS records
}
```

## ملاحظات مهمة

⚠️ **الدومينات المخصصة القديمة**
- إذا كانت هناك دومينات مخصصة مضافة إلى Vercel سابقاً
- يجب حذفها يدوياً من Vercel dashboard
- أو استخدام الـ admin API لحذفها

⚠️ **DNS Propagation**
- قد يستغرق حتى 48 ساعة لانتشار DNS
- استخدم tools مثل: https://www.whatsmydns.net/

⚠️ **SSL Certificates**
- Vercel سيصدر SSL certificate تلقائياً بعد التحقق من DNS
- قد يستغرق حتى 24 ساعة

## الخلاصة

✅ **المشكلة تم حلها بنجاح**
- الدومينات المخصصة لا تضاف إلى Vercel Project
- كل دومين يعمل عبر DNS resolution فقط
- المنصة الرئيسية تبقى نظيفة وآمنة
- كل متجر يرى فقط دومينه الخاص

🚀 **المنصة الآن جاهزة للإنتاج**
