# دليل اختبار نظام الدومينات المخصصة

## 1. اختبار Backend API

### 1.1 اختبر إضافة دومين مخصص
```bash
curl -X POST http://localhost:3001/merchant/domain/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mystore.com"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم إرسال طلب الدومين المخصص بنجاح!",
  "domain": "mystore.com",
  "dnsRecords": {
    "aRecord": {
      "type": "A",
      "name": "@",
      "value": "76.76.21.21",
      "ttl": 3600
    },
    "cnameRecord": {
      "type": "CNAME",
      "name": "www",
      "value": "cname.vercel-dns.com",
      "ttl": 3600
    }
  },
  "isVerified": false,
  "note": "الدومين المخصص سيعمل تلقائياً بعد إضافة سجلات DNS"
}
```

### 1.2 اختبر الـ resolve endpoint
```bash
curl -X GET "http://localhost:3001/domains/resolve?host=mystore.com"
```

**النتيجة المتوقعة:**
```json
{
  "found": true,
  "tenantId": "tenant-id-123",
  "subdomain": "store-slug"
}
```

### 1.3 اختبر قبول الدومين (Admin)
```bash
curl -X POST http://localhost:3001/admin/domains/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-id-123",
    "domain": "mystore.com"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "id": "domain-id",
  "domain": "mystore.com",
  "tenantId": "tenant-id-123",
  "isVerified": true,
  "sslEnabled": true
}
```

## 2. اختبار Database

### 2.1 تحقق من حفظ الدومين
```sql
SELECT * FROM "CustomDomain" WHERE domain = 'mystore.com';
```

**النتيجة المتوقعة:**
```
id          | domain      | tenantId | isVerified | sslEnabled | dnsRecords | createdAt
------------|-------------|----------|-----------|-----------|------------|----------
domain-123  | mystore.com | tenant-1 | false     | false     | {...}     | 2024-01-15
```

### 2.2 تحقق من عدم إضافة الدومين إلى Vercel
```bash
# لا يجب أن تجد الدومين في Vercel Project
curl -X GET "https://api.vercel.com/v9/projects/YOUR_PROJECT_ID/domains/mystore.com" \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "error": {
    "code": "not_found",
    "message": "Domain not found"
  }
}
```

## 3. اختبار Frontend Middleware

### 3.1 اختبر الـ middleware locally
```bash
# في terminal جديد
cd frontend
npm run dev
```

### 3.2 اختبر الـ resolve endpoint من Frontend
```bash
curl -X GET "http://localhost:3000/api/stores/by-domain?domain=mystore.com"
```

**النتيجة المتوقعة:**
```json
{
  "id": "store-id",
  "name": "My Store",
  "slug": "store-slug",
  "custom_domain": "mystore.com"
}
```

## 4. اختبار DNS Configuration

### 4.1 أضف DNS records في DNS Provider
في Hostinger أو أي DNS provider:

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

### 4.2 تحقق من DNS propagation
```bash
# استخدم أي من هذه الأدوات:
nslookup mystore.com
dig mystore.com
host mystore.com

# أو استخدم online tool:
# https://www.whatsmydns.net/
```

**النتيجة المتوقعة:**
```
mystore.com has address 76.76.21.21
www.mystore.com is an alias for cname.vercel-dns.com
```

## 5. اختبار End-to-End

### 5.1 اختبر الوصول إلى الدومين المخصص
```bash
# بعد انتشار DNS (24-48 ساعة)
curl -X GET "https://mystore.com" \
  -H "Host: mystore.com"
```

**النتيجة المتوقعة:**
- يجب أن ترى صفحة المتجر
- الـ URL يجب أن يبقى: https://mystore.com
- الـ middleware يجب أن يعيد كتابة الطلب إلى /store/store-slug

### 5.2 اختبر الـ middleware logs
```bash
# في terminal الـ frontend
# يجب أن ترى logs مثل:
🔍 [Middleware] Host: mystore.com Path: /
🔍 [Middleware] Resolving domain via backend: https://api.example.com/domains/resolve?host=mystore.com
🔄 [Middleware] Rewriting custom domain: mystore.com -> /store/store-slug
```

## 6. اختبار الحالات الخاصة

### 6.1 اختبر دومين غير موجود
```bash
curl -X GET "http://localhost:3001/domains/resolve?host=nonexistent.com"
```

**النتيجة المتوقعة:**
```json
{
  "found": false
}
```

### 6.2 اختبر دومين مع www
```bash
curl -X GET "http://localhost:3001/domains/resolve?host=www.mystore.com"
```

**النتيجة المتوقعة:**
```json
{
  "found": true,
  "tenantId": "tenant-id-123",
  "subdomain": "store-slug"
}
```

### 6.3 اختبر دومين مع منفذ
```bash
curl -X GET "http://localhost:3001/domains/resolve?host=mystore.com:443"
```

**النتيجة المتوقعة:**
```json
{
  "found": true,
  "tenantId": "tenant-id-123",
  "subdomain": "store-slug"
}
```

## 7. اختبار الأداء

### 7.1 اختبر سرعة الـ resolve endpoint
```bash
# استخدم Apache Bench
ab -n 1000 -c 10 "http://localhost:3001/domains/resolve?host=mystore.com"
```

**النتيجة المتوقعة:**
- Requests per second: > 100
- Mean time per request: < 100ms

### 7.2 اختبر سرعة الـ middleware
```bash
# استخدم curl مع timing
curl -w "@curl-format.txt" -o /dev/null -s "https://mystore.com"
```

## 8. اختبار الأمان

### 8.1 اختبر عدم الوصول إلى دومين آخر
```bash
# حاول الوصول إلى دومين متجر آخر
curl -X GET "http://localhost:3001/domains/resolve?host=otherstore.com"
```

**النتيجة المتوقعة:**
- يجب أن ترجع بيانات المتجر الآخر فقط
- لا يجب أن ترى بيانات متجرك

### 8.2 اختبر SQL Injection
```bash
curl -X GET "http://localhost:3001/domains/resolve?host=mystore.com'; DROP TABLE CustomDomain; --"
```

**النتيجة المتوقعة:**
- يجب أن تحصل على خطأ 404
- جدول CustomDomain يجب أن يبقى سليماً

## 9. اختبار الـ Rollback

### 9.1 إذا حدثت مشكلة
```bash
# تحقق من الـ logs
docker logs backend-container
docker logs frontend-container

# تحقق من قاعدة البيانات
SELECT * FROM "CustomDomain" WHERE domain = 'mystore.com';

# تحقق من Vercel
# تأكد من أن الدومين لم يُضف إلى Vercel Project
```

## 10. Checklist النشر

- [ ] تم اختبار إضافة دومين مخصص
- [ ] تم اختبار الـ resolve endpoint
- [ ] تم اختبار قبول الدومين من Admin
- [ ] تم التحقق من عدم إضافة الدومين إلى Vercel
- [ ] تم اختبار DNS configuration
- [ ] تم اختبار الوصول إلى الدومين المخصص
- [ ] تم اختبار الـ middleware logs
- [ ] تم اختبار الحالات الخاصة
- [ ] تم اختبار الأداء
- [ ] تم اختبار الأمان
- [ ] تم التحقق من عدم وجود أخطاء في الـ logs
- [ ] تم التحقق من عدم وجود أخطاء في قاعدة البيانات

## ملاحظا�� مهمة

⚠️ **DNS Propagation قد يستغرق وقتاً**
- قد يستغرق حتى 48 ساعة
- استخدم https://www.whatsmydns.net/ للتحقق

⚠️ **SSL Certificate**
- Vercel سيصدر SSL certificate تلقائياً
- قد يستغرق حتى 24 ساعة

⚠️ **الدومينات المخصصة القديمة**
- إذا كانت هناك دومينات مضافة إلى Vercel سابقاً
- يجب حذفها يدوياً من Vercel dashboard

## الدعم

إذا واجهت مشكلة:
1. تحقق من الـ logs
2. تحقق من قاعدة البيانات
3. تحقق من DNS configuration
4. تحقق من Vercel Project
5. اقرأ CUSTOM_DOMAIN_FIX.md للمزيد من المعلومات
