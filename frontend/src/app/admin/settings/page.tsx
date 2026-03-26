'use client';

import { useState, useEffect } from 'react';
import { Settings, Zap, Save, Shield, Package, ShoppingCart, CreditCard, Truck, Image, MessageSquare, Star } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'STANDARD' | 'PRO'>('FREE');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getPlanFeatures();
      setPlanFeatures(data);
    } catch (error) {
      console.error('Error loading features:', error);
      // Set defaults if API fails
      setPlanFeatures({
        FREE: {
          maxProducts: 50,
          maxOrders: 100,
          variants: false,
          bulkPricing: false,
          reviews: false,
          seasonalOffers: false,
          advancedSEO: false,
          multipleImages: 5,
          customDomain: false,
          prioritySupport: false,
        },
        STANDARD: {
          maxProducts: 200,
          maxOrders: 500,
          variants: true,
          bulkPricing: true,
          reviews: true,
          seasonalOffers: true,
          advancedSEO: true,
          multipleImages: 10,
          customDomain: false,
          prioritySupport: false,
        },
        PRO: {
          maxProducts: -1,
          maxOrders: -1,
          variants: true,
          bulkPricing: true,
          reviews: true,
          seasonalOffers: true,
          advancedSEO: true,
          multipleImages: 20,
          customDomain: true,
          prioritySupport: true,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updatePlanFeatures(selectedPlan, planFeatures[selectedPlan]);
      alert('تم حفظ الإعدادات بنجاح! ✅');
    } catch (error) {
      alert('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (feature: string, value: any) => {
    setPlanFeatures({
      ...planFeatures,
      [selectedPlan]: {
        ...planFeatures[selectedPlan],
        [feature]: value,
      },
    });
  };

  if (loading || !planFeatures) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const currentPlan = planFeatures[selectedPlan];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات المنصة</h1>
          <p className="text-gray-600">التحكم في ميزات الخطط والمتاجر</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Plan Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">اختر الخطة للتعديل</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedPlan('FREE')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedPlan === 'FREE'
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900">FREE</h3>
                <p className="text-sm text-gray-600">مجاني</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">0 دج</p>
          </button>

          <button
            onClick={() => setSelectedPlan('STANDARD')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedPlan === 'STANDARD'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900">STANDARD</h3>
                <p className="text-sm text-gray-600">قياسي</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600">1,350 دج</p>
          </button>

          <button
            onClick={() => setSelectedPlan('PRO')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedPlan === 'PRO'
                ? 'border-purple-500 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900">PRO</h3>
                <p className="text-sm text-gray-600">احترافي</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600">2,500 دج</p>
          </button>
        </div>
      </div>

      {/* Features Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ميزات خطة {selectedPlan}</h2>

        <div className="space-y-6">
          {/* Limits */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              الحدود الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الحد الأقصى للمنتجات
                </label>
                <input
                  type="number"
                  value={currentPlan.maxProducts === -1 ? '' : currentPlan.maxProducts}
                  onChange={(e) => updateFeature('maxProducts', e.target.value === '' ? -1 : parseInt(e.target.value))}
                  placeholder="غير محدود"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">اترك فارغاً لـ "غير محدود"</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الحد الأقصى للطلبات الشهرية
                </label>
                <input
                  type="number"
                  value={currentPlan.maxOrders === -1 ? '' : currentPlan.maxOrders}
                  onChange={(e) => updateFeature('maxOrders', e.target.value === '' ? -1 : parseInt(e.target.value))}
                  placeholder="غير محدود"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  عدد الصور لكل منتج
                </label>
                <input
                  type="number"
                  value={currentPlan.multipleImages}
                  onChange={(e) => updateFeature('multipleImages', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Product Features */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              ميزات المنتجات
            </h3>
            <div className="space-y-3">
              <FeatureToggle
                icon={<Package />}
                title="المتغيرات (Variants)"
                description="السماح بإضافة متغيرات للمنتجات (مقاسات، ألوان، إلخ)"
                enabled={currentPlan.variants}
                onChange={(val) => updateFeature('variants', val)}
              />

              <FeatureToggle
                icon={<ShoppingCart />}
                title="التسعير المتدرج (Bulk Pricing)"
                description="عروض الكمية والخصومات المتدرجة"
                enabled={currentPlan.bulkPricing}
                onChange={(val) => updateFeature('bulkPricing', val)}
              />

              <FeatureToggle
                icon={<Image />}
                title="SEO المتقدم"
                description="أدوات تحسين محركات البحث المتقدمة"
                enabled={currentPlan.advancedSEO}
                onChange={(val) => updateFeature('advancedSEO', val)}
              />
            </div>
          </div>

          {/* Storefront Features */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              ميزات واجهة المتجر
            </h3>
            <div className="space-y-3">
              <FeatureToggle
                icon={<MessageSquare />}
                title="آراء العملاء"
                description="عرض وإدارة تقييمات العملاء"
                enabled={currentPlan.reviews}
                onChange={(val) => updateFeature('reviews', val)}
              />

              <FeatureToggle
                icon={<Star />}
                title="العروض الموسمية"
                description="إنشاء وإدارة العروض الموسمية"
                enabled={currentPlan.seasonalOffers}
                onChange={(val) => updateFeature('seasonalOffers', val)}
              />
            </div>
          </div>

          {/* Advanced Features */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-600" />
              ميزات متقدمة
            </h3>
            <div className="space-y-3">
              <FeatureToggle
                icon={<Shield />}
                title="دومين مخصص"
                description="ربط دومين خاص بالمتجر"
                enabled={currentPlan.customDomain}
                onChange={(val) => updateFeature('customDomain', val)}
              />

              <FeatureToggle
                icon={<MessageSquare />}
                title="الدعم الفوري"
                description="دعم فني بأولوية عالية"
                enabled={currentPlan.prioritySupport}
                onChange={(val) => updateFeature('prioritySupport', val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </button>
      </div>
    </div>
  );
}

// Component for feature toggle
interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}

function FeatureToggle({ icon, title, description, enabled, onChange }: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white rounded-lg text-gray-600">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
