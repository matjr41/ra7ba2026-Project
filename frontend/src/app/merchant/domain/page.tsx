'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { merchantApi } from '@/lib/api';
import { toast } from 'sonner';
import { Globe, CheckCircle, AlertCircle, ExternalLink, Copy, Info } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';

export default function CustomDomainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await merchantApi.getDashboard();
      const tenant = response.data.tenant;
      setSubdomain(tenant.subdomain);
      
      // تحميل معلومات الدومين المخصص
      try {
        const domainResponse = await merchantApi.getCustomDomain();
        if (domainResponse.data) {
          setCurrentDomain(domainResponse.data.domain);
          setIsVerified(domainResponse.data.isVerified);
          
          // تحويل dnsRecords من object إلى array
          const dnsData = domainResponse.data.dnsRecords;
          if (dnsData) {
            const records = [];
            if (dnsData.aRecord) records.push(dnsData.aRecord);
            if (dnsData.cnameRecord) records.push(dnsData.cnameRecord);
            setDnsRecords(records);
          }
        }
      } catch (domainError: any) {
        // لا يوجد دومين مخصص بعد
        if (domainError.response?.status !== 404) {
          console.error('Error loading custom domain:', domainError);
        }
      }
    } catch (error) {
      console.error('Error loading domain data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDomain = async () => {
    if (!domain || !domain.includes('.')) {
      toast.error('يرجى إدخال نطاق صحيح (مثال: store.com)');
      return;
    }

    try {
      setSaving(true);
      const response = await merchantApi.requestCustomDomain(domain);
      toast.success(response.data.message || 'تم إرسال طلب الدومين المخصص!');
      
      // تحديث البيانات
      await loadData();
      setDomain('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshDomain = async () => {
    try {
      setSaving(true);
      
      // التحقق من وجود token قبل المحاولة
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('accessToken');
        if (!token) {
          toast.error('يجب تسجيل الدخول أولاً');
          router.push('/auth/login');
          return;
        }
      }
      
      const response = await merchantApi.refreshDomainStatus();
      
      // عرض معلومات إضافية إذا كانت موجودة
      if (response.data.vercelStatus) {
        console.log('Vercel Status:', response.data.vercelStatus);
      }
      
      if (response.data.isVerified) {
        toast.success(response.data.message || 'الدومين محقق بنجاح! ✅');
      } else {
        toast.warning(response.data.message || 'الدومين لم يتم التحقق منه بعد. يرجى التحقق من إعدادات DNS.');
      }
      
      // تحديث البيانات
      await loadData();
    } catch (error: any) {
      console.error('Domain refresh error:', error);
      
      // معالجة خاصة لخطأ 401
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('accessToken');
          window.localStorage.removeItem('refreshToken');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } else {
        const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تحديث حالة الدومين';
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ إلى الحافظة');
  };

  const handleDeleteDomain = async () => {
    if (!confirm('هل أنت متأكد من حذف الدومين المخصص؟ سيتم حذف جميع الإعدادات المرتبطة به.')) {
      return;
    }

    try {
      setSaving(true);
      await merchantApi.deleteCustomDomain();
      toast.success('تم حذف الدومين المخصص بنجاح');
      
      // إعادة تحميل البيانات
      setCurrentDomain('');
      setIsVerified(false);
      setDnsRecords([]);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حذف الدومين');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">الدومين المخصص</h1>
          <p className="text-gray-600">اربط متجرك بدومين خاص بك</p>
        </div>

        <div className="space-y-6">
          {/* Current Domain */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">الدومين الحالي</h2>
                <p className="text-sm text-gray-500">عنوان متجرك الحالي</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-lg font-mono text-gray-700">
                  ra7ba.shop/store/{subdomain}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`https://ra7ba.shop/store/${subdomain}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <a
                href={`https://ra7ba.shop/store/${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                زيارة المتجر
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Custom Domain Request */}
          {!currentDomain && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">طلب دومين مخصص</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">متاح في الخطة الاحترافية فقط</p>
                  <p>الدومين المخصص متاح فقط للمتاجر المشتركة في الخطة الاحترافية (PRO)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">الدومين المخصص</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="store.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase())}
                    dir="ltr"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يجب أن تمتلك هذا الدومين وتكون قادراً على تعديل إعدادات DNS الخاصة به
                  </p>
                </div>

                <Button
                  onClick={handleRequestDomain}
                  disabled={saving || !domain}
                  className="w-full h-12 text-lg font-bold"
                >
                  {saving ? 'جاري الإرسال...' : 'إرسال طلب الدومين'}
                </Button>
              </div>
            </div>
          )}

          {/* DNS Configuration (if domain is pending) */}
          {currentDomain && !isVerified && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-xl p-6 border-2 border-orange-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">⚠️ يتطلب إعداد DNS</h2>
                  <p className="text-sm text-gray-600">أضف السجلات التالية في لوحة تحكم الدومين (Hostinger)</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 border-2 border-orange-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">🌐 الدومين المطلوب:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-2xl font-mono font-bold text-blue-600">{currentDomain}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(currentDomain)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-gray-900">📋 السجلات المطلوبة:</h3>
                  {dnsRecords.length > 0 ? (
                    dnsRecords.map((record, index) => (
                      <div key={index} className="bg-white rounded-xl p-5 border-2 border-gray-300 hover:border-blue-400 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">
                            سجل {record.type}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.value)}
                            className="h-8"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            نسخ القيمة
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 font-semibold uppercase">النوع</span>
                            <p className="font-mono text-lg font-bold mt-1">{record.type}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 font-semibold uppercase">الاسم</span>
                            <p className="font-mono text-lg font-bold mt-1">{record.name}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 font-semibold uppercase">القيمة</span>
                            <p className="font-mono text-sm font-bold mt-1 text-blue-600 break-all">{record.value}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-900 font-semibold">
                        ⏳ سجلات DNS قيد الإعداد... يرجى تحديث الصفحة بعد قليل
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-5">
                  <p className="text-sm text-yellow-900 font-bold mb-2">⚠️ تعليمات مهمة:</p>
                  <ul className="text-sm text-yellow-800 space-y-1 mr-4">
                    <li>• افتح لوحة DNS في Hostinger لدومين <code className="font-mono bg-yellow-200 px-1">{currentDomain}</code></li>
                    <li>• أضف السجلين أعلاه بالضبط كما هما</li>
                    <li>• قد يستغرق التفعيل من 15 دقيقة إلى 48 ساعة</li>
                    <li>• سيتم تفعيل SSL (https) تلقائياً بعد التحقق</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleRefreshDomain}
                    disabled={saving}
                  >
                    🔄 تحديث الحالة
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteDomain}
                    disabled={saving}
                  >
                    🗑️ حذف الدومين المخصص
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Verified Domain */}
          {currentDomain && isVerified && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">الدومين المخصص نشط</h2>
                  <p className="text-sm text-gray-500">متجرك متاح الآن على الدومين المخصص</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono text-green-700">{currentDomain}</code>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshDomain}
                      disabled={saving}
                    >
                      🔄 تحديث
                    </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteDomain}
                    disabled={saving}
                  >
                    🗑️ حذف الدومين
                  </Button>
                    <a
                      href={`https://${currentDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      زيارة المتجر
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DNS Setup Guide - Simplified */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">كيفية ربط دومينك الخاص؟</h2>
                <p className="text-sm text-gray-500">خطوات بسيطة لربط الدومين - لا حاجة لتغيير Nameservers</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">اطلب دومينك المخصص</h3>
                    <p className="text-sm text-gray-600">أدخل اسم الدومين أعلاه واضغط "إرسال طلب الدومين"</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">أضف السجلات في لوحة DNS</h3>
                    <p className="text-sm text-gray-600 mb-4">افتح لوحة تحكم الدومين (Hostinger/Namecheap/GoDaddy) وأضف:</p>
                    
                    <div className="space-y-3">
                      {/* A Record */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">سجل A (للدومين الرئيسي)</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard('216.24.57.1')}
                            className="h-7"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            نسخ
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">النوع:</span>
                            <p className="font-mono font-semibold">A</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">الاسم:</span>
                            <p className="font-mono font-semibold">@</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">القيمة:</span>
                            <p className="font-mono font-semibold text-blue-600">216.24.57.1</p>
                          </div>
                        </div>
                      </div>

                      {/* CNAME Record */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">سجل CNAME (www)</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard('ra7ba-fr.onrender.com')}
                            className="h-7"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            نسخ
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">النوع:</span>
                            <p className="font-mono font-semibold">CNAME</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">الاسم:</span>
                            <p className="font-mono font-semibold">www</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">القيمة:</span>
                            <p className="font-mono font-semibold text-blue-600">ra7ba-fr.onrender.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">انتظر التفعيل</h3>
                    <p className="text-sm text-gray-600">قد يستغرق الأمر من 15 دقيقة إلى 24 ساعة. سيتم تفعيل SSL تلقائياً بعد التحقق.</p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ نصائح مهمة:</p>
                <ul className="text-sm text-amber-800 space-y-1 mr-4">
                  <li>• لا تضع سجل A للـ www (فقط CNAME)</li>
                  <li>• اضبط TTL على 300 ثانية (أو أقل قيمة متاحة)</li>
                  <li>• لا تغير Nameservers - فقط أضف السجلات</li>
                  <li>• تأكد من حذف أي سجلات قديمة تتعارض</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات مفيدة</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>الدومين المخصص متاح فقط للخطة الاحترافية (PRO)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>يتم مراجعة طلبات الدومين من قبل الإدارة خلال 24 ساعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>شهادة SSL مجانية يتم تثبيتها تلقائياً</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>يمكنك الاحتفاظ بالدومين الفرعي القديم إلى جانب الدومين المخصص</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
