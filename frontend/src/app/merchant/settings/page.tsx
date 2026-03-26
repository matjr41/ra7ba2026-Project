'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Store, Palette, Link2, Bell, Save, Upload, Globe,
  Check, MessageSquare, Shield, Truck, Sparkles, Heart,
} from 'lucide-react';
import { merchantApi } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/upload';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRealtimeStore } from '@/hooks/useRealtimeStore';
import { Switch } from '@/components/ui/switch';

const TabButton = ({ active, icon: Icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-semibold transition-all duration-300 ${
      active ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, className = '', textarea = false }: any) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
    )}
  </div>
);

export default function MerchantSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store data
  const [storeData, setStoreData] = useState<any>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    logo: '',
    banner: '',
    favicon: '',
    phone: '',
    address: '',
    telegramChatId: '',
    theme: {},
    checkoutConfig: {},
    storeFeatures: {},
    thankYouMessage: '',
    thankYouImage: '',
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const thankYouImageInputRef = useRef<HTMLInputElement>(null);

  // Real-time sync
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { storeData: realtimeData, isConnected } = useRealtimeStore(tenantId);

  // Load store settings
  useEffect(() => {
    loadStoreSettings();
  }, []);

  // Update local state when real-time data changes
  useEffect(() => {
    if (realtimeData) {
      console.log('🔄 Updating store data from real-time sync');
      setStoreData((prev: any) => ({ ...prev, ...realtimeData }));
      toast.success('تم تحديث البيانات تلقائياً! 🔄', { duration: 2000 });
    }
  }, [realtimeData]);

  const loadStoreSettings = async () => {
    try {
      setLoading(true);
      const response = await merchantApi.getDashboard();
      if (response.data?.tenant) {
        setStoreData(response.data.tenant);
        setTenantId(response.data.tenant.id); // Set tenant ID for real-time sync
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
      toast.error('فشل تحميل إعدادات المتجر');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: any) => {
    try {
      setSaving(true);
      console.log('💾 Saving updates:', updates);

      // Upload files first if they exist
      if (updates.logo instanceof File) {
        const logoUrl = await uploadImageToImgBB(updates.logo, 'store/logos');
        updates.logo = logoUrl;
      }

      if (updates.banner instanceof File) {
        const bannerUrl = await uploadImageToImgBB(updates.banner, 'store/banners');
        updates.banner = bannerUrl;
      }

      if (updates.thankYouImage instanceof File) {
        const imageUrl = await uploadImageToImgBB(updates.thankYouImage, 'store/thankyou');
        updates.thankYouImage = imageUrl;
      }

      if (updates.favicon instanceof File) {
        const faviconUrl = await uploadImageToImgBB(updates.favicon, 'store/favicons');
        updates.favicon = faviconUrl;
      }

      const response = await merchantApi.updateStore(updates);
      
      setStoreData((prev: any) => ({ ...prev, ...response.data }));
      toast.success('✅ تم حفظ التغييرات بنجاح!');
      
      // Refresh to show changes
      router.refresh();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSave({ logo: file });
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSave({ banner: file });
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSave({ favicon: file });
    }
  };

  const handleThankYouImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSave({ thankYouImage: file });
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
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">إعدادات المتجر</h1>
              <p className="text-gray-600">تحكم كامل في متجرك الإلكتروني</p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-semibold">متصل - مزامنة فورية</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-2">
            <div className="space-y-1">
              <TabButton
                active={activeTab === 'general'}
                icon={Store}
                label="الإعدادات العامة"
                onClick={() => setActiveTab('general')}
              />
              <TabButton
                active={activeTab === 'design'}
                icon={Palette}
                label="التصميم والألوان"
                onClick={() => setActiveTab('design')}
              />
              
              <TabButton
                active={activeTab === 'notifications'}
                icon={Bell}
                label="الإشعارات"
                onClick={() => setActiveTab('notifications')}
              />
              <TabButton
                active={activeTab === 'features'}
                icon={Sparkles}
                label="الميزات"
                onClick={() => setActiveTab('features')}
              />
              <TabButton
                active={activeTab === 'thankyou'}
                icon={Heart}
                label="صفحة الشكر"
                onClick={() => setActiveTab('thankyou')}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Store className="w-6 h-6 text-blue-500" />
                  الإعدادات العامة
                </h2>

                <div className="space-y-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">شعار المتجر</label>
                    <div className="flex items-center gap-4">
                      {storeData.logo && (
                        <img src={storeData.logo} alt="Logo" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" />
                      )}
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 inline-block ml-2" />
                        {saving ? 'جاري الرفع...' : 'رفع شعار'}
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Banner */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الغلاف</label>
                    <div className="flex items-center gap-4">
                      {storeData.banner && (
                        <img src={storeData.banner} alt="Banner" className="w-40 h-20 object-cover rounded-lg border-2 border-gray-200" />
                      )}
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 inline-block ml-2" />
                        {saving ? 'جاري الرفع...' : 'رفع صورة'}
                      </button>
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Favicon - Custom Tab Icon */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      أيقونة التبويب (Favicon)
                    </label>
                    <p className="text-xs text-gray-600 mb-3">الأيقونة التي تظهر في تبويب المتصفح لمتجرك</p>
                    <div className="flex items-center gap-4">
                      {storeData.favicon && (
                        <img src={storeData.favicon} alt="Favicon" className="w-16 h-16 object-cover rounded-lg border-2 border-purple-300" />
                      )}
                      <button
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 inline-block ml-2" />
                        {saving ? 'جاري الرفع...' : 'رفع أيقونة'}
                      </button>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*,.ico"
                        onChange={handleFaviconChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="اسم المتجر (عربي)"
                      value={storeData.nameAr || ''}
                      onChange={(e: any) => setStoreData({ ...storeData, nameAr: e.target.value })}
                      placeholder="اسم متجرك بالعربية"
                    />
                    <InputField
                      label="اسم المتجر (إنجليزي)"
                      value={storeData.name || ''}
                      onChange={(e: any) => setStoreData({ ...storeData, name: e.target.value })}
                      placeholder="Store Name"
                    />
                  </div>

                  <InputField
                    label="وصف المتجر"
                    value={storeData.description || ''}
                    onChange={(e: any) => setStoreData({ ...storeData, description: e.target.value })}
                    placeholder="وصف مختصر عن متجرك"
                    textarea
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="رقم الهاتف"
                      value={storeData.phone || ''}
                      onChange={(e: any) => setStoreData({ ...storeData, phone: e.target.value })}
                      placeholder="+213 XXX XXX XXX"
                    />
                    <InputField
                      label="العنوان"
                      value={storeData.address || ''}
                      onChange={(e: any) => setStoreData({ ...storeData, address: e.target.value })}
                      placeholder="عنوان المتجر"
                    />
                  </div>

                  <button
                    onClick={() => handleSave({
                      name: storeData.name,
                      nameAr: storeData.nameAr,
                      description: storeData.description,
                      phone: storeData.phone,
                      address: storeData.address,
                    })}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </div>
            )}

            {/* Design & Colors */}
            {activeTab === 'design' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-blue-500" />
                  التصميم والألوان
                </h2>

                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اللون الأساسي للمتجر
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-gray-200"
                            style={{ backgroundColor: storeData?.theme?.primaryColor || '#3B82F6' }}
                            aria-label="المعاينة"
                          />
                          <span className="text-sm text-gray-600 min-w-[96px]">
                            {storeData?.theme?.primaryColor || '#3B82F6'}
                          </span>
                        </div>
                        <input
                          type="color"
                          value={storeData?.theme?.primaryColor || '#3B82F6'}
                          onChange={(e) =>
                            setStoreData((prev: any) => ({
                              ...prev,
                              theme: { ...(prev.theme || {}), primaryColor: e.target.value },
                            }))
                          }
                          className="h-10 w-12 p-0 border-2 border-gray-200 rounded-lg cursor-pointer"
                          aria-label="اختيار اللون"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#22C55E","#E11D48"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setStoreData((prev: any) => ({
                                ...prev,
                                theme: { ...(prev.theme || {}), primaryColor: c },
                              }))
                            }
                            className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-gray-200 transition-transform hover:scale-105"
                            style={{ backgroundColor: c }}
                            aria-label={`اختر ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Theme Mode */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      نمط الواجهة
                    </label>
                    <select
                      value={storeData?.theme?.mode || 'light'}
                      onChange={(e) => setStoreData((prev: any) => ({
                        ...prev,
                        theme: { ...(prev.theme || {}), mode: e.target.value },
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">فاتح</option>
                      <option value="dark">داكن</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      خط النص
                    </label>
                    <select
                      value={storeData?.theme?.fontFamily || 'cairo'}
                      onChange={(e) => setStoreData((prev: any) => ({
                        ...prev,
                        theme: { ...(prev.theme || {}), fontFamily: e.target.value },
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cairo">Cairo (الافتراضي)</option>
                      <option value="tajawal">Tajawal</option>
                      <option value="amiri">Amiri</option>
                      <option value="inter">Inter</option>
                      <option value="poppins">Poppins</option>
                    </select>
                  </div>

                  {/* Layout Direction */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اتجاه التخطيط
                    </label>
                    <select
                      value={storeData?.theme?.direction || 'rtl'}
                      onChange={(e) => setStoreData((prev: any) => ({
                        ...prev,
                        theme: { ...(prev.theme || {}), direction: e.target.value },
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rtl">من اليمين إلى اليسار (RTL)</option>
                      <option value="ltr">من اليسار إلى اليمين (LTR)</option>
                    </select>
                  </div>

                  {/* Store Logo & Banner - Already implemented above */}

                  <button
                    onClick={() => handleSave({ theme: storeData.theme })}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التصميم'}
                  </button>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  الميزات المتقدمة
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-800">تفعيل سلة التسوق</p>
                      <p className="text-sm text-gray-500">عند الإيقاف يتم التبديل إلى "اطلب الآن" مباشرة</p>
                    </div>
                    <Switch
                      checked={Boolean(storeData?.storeFeatures?.enableCart ?? true)}
                      onCheckedChange={(checked) =>
                        setStoreData((prev: any) => ({
                          ...prev,
                          storeFeatures: { ...(prev.storeFeatures || {}), enableCart: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-800">تفعيل الخصومات</p>
                      <p className="text-sm text-gray-500">السماح بعرض منتجات مع خصومات</p>
                    </div>
                    <Switch
                      checked={Boolean(storeData?.storeFeatures?.enableDiscounts ?? true)}
                      onCheckedChange={(checked) =>
                        setStoreData((prev: any) => ({
                          ...prev,
                          storeFeatures: { ...(prev.storeFeatures || {}), enableDiscounts: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-800">تفعيل المتغيرات</p>
                      <p className="text-sm text-gray-500">السماح بإضافة متغيرات للمنتجات (الألوان، المقاسات)</p>
                    </div>
                    <Switch
                      checked={Boolean(storeData?.storeFeatures?.enableVariants ?? true)}
                      onCheckedChange={(checked) =>
                        setStoreData((prev: any) => ({
                          ...prev,
                          storeFeatures: { ...(prev.storeFeatures || {}), enableVariants: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-800">تفعيل التوصيل</p>
                      <p className="text-sm text-gray-500">إظهار خيارات التوصيل والشحن</p>
                    </div>
                    <Switch
                      checked={Boolean(storeData?.storeFeatures?.enableShipping ?? true)}
                      onCheckedChange={(checked) =>
                        setStoreData((prev: any) => ({
                          ...prev,
                          storeFeatures: { ...(prev.storeFeatures || {}), enableShipping: checked },
                        }))
                      }
                    />
                  </div>

                  <button
                    onClick={() => handleSave({ storeFeatures: storeData.storeFeatures })}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </button>
                </div>
              </div>
            )}

            {/* Thank You Page */}
            {activeTab === 'thankyou' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500" />
                  صفحة الشكر بعد الطلب
                </h2>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border-2 border-pink-200">
                    <p className="text-sm text-gray-700">
                      💝 صمم صفحة شكر مخصصة تظهر للعميل بعد إتمام الطلب بنجاح. أضف رسالة شكر مميزة وصورة تعبر عن علامتك التجارية.
                    </p>
                  </div>

                  {/* Thank You Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">صورة صفحة الشكر</label>
                    <div className="flex items-center gap-4">
                      {storeData.thankYouImage && (
                        <img 
                          src={storeData.thankYouImage} 
                          alt="Thank you" 
                          className="w-40 h-40 object-cover rounded-lg border-2 border-pink-200" 
                        />
                      )}
                      <div>
                        <button
                          onClick={() => thankYouImageInputRef.current?.click()}
                          disabled={saving}
                          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4 inline-block ml-2" />
                          {saving ? 'جاري الرفع...' : 'رفع صورة'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          صورة تعبيرية تظهر في صفحة الشكر (يفضل 400x400 بكسل)
                        </p>
                      </div>
                      <input
                        ref={thankYouImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThankYouImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Thank You Message */}
                  <InputField
                    label="رسالة الشكر"
                    value={storeData.thankYouMessage || ''}
                    onChange={(e: any) => setStoreData({ ...storeData, thankYouMessage: e.target.value })}
                    placeholder="مثال: شكراً لثقتك! تم استلام طلبك وسنتواصل معك قريباً..."
                    textarea
                    className="mb-4"
                  />

                  <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚡ نصيحة: استخدم رسالة ودودة ومطمئنة تشكر العميل وتوضح الخطوات القادمة
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave({ 
                      thankYouMessage: storeData.thankYouMessage,
                      thankYouImage: storeData.thankYouImage 
                    })}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ صفحة الشكر'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-blue-500" />
                  إعدادات الإشعارات
                </h2>

                <div className="space-y-6">
                  <InputField
                    label="Telegram Chat ID"
                    value={storeData.telegramChatId || ''}
                    onChange={(e: any) => setStoreData({ ...storeData, telegramChatId: e.target.value })}
                    placeholder="أدخل Chat ID للحصول على إشعارات تيليجرام"
                  />

                  <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 للحصول على Chat ID، تحدث مع البوت @userinfobot على تيليجرام
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave({ telegramChatId: storeData.telegramChatId })}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الإشعارات'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
