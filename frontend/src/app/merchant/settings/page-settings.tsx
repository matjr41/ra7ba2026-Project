'use client';

import { useState, useRef } from 'react';
import { 
  Store, Palette, Link2, Bell, Save, Upload, Globe, Smartphone,
  Eye, EyeOff, Check, Zap, Share2, MessageSquare, Mail, Image as ImageIcon,
} from 'lucide-react';

// المكونات المساعدة
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

const InputField = ({ label, type = 'text', value, onChange, placeholder, className = '' }: any) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
    />
  </div>
);

const ToggleSwitch = ({ enabled, onChange, title, description }: any) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <button
      onClick={onChange}
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

export default function MerchantSettingsComplete() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // الإعدادات
  const [generalSettings, setGeneralSettings] = useState({
    storeName: '', storeNameAr: '', subdomain: '', defaultLanguage: 'ar',
    storeEnabled: true, customDomain: '', logo: null, banner: null,
  });

  const [designSettings, setDesignSettings] = useState({
    primaryColor: '#3B82F6', secondaryColor: '#8B5CF6', theme: 'light',
    productDisplayMode: 'grid', buttonStyle: 'rounded', showFooter: true,
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    tiktokApiKey: '', facebookPixelId: '', googleSheetsApiKey: '', customWebhookUrl: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true, telegramBotToken: '', telegramChatId: '',
    newOrderMessage: 'تم استلام طلب جديد!',
  });

  const saveSettings = async (endpoint: string, data: any) => {
    setSaving(true);
    try {
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إعدادات المتجر</h1>
          <p className="text-gray-600">تحكم كامل في متجرك الإلكتروني</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border-r-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-700" />
            <p className="text-green-700 font-semibold">تم الحفظ بنجاح!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-2">
            <nav className="space-y-1">
              <TabButton active={activeTab === 'general'} icon={Store} label="إعدادات عامة" onClick={() => setActiveTab('general')} />
              <TabButton active={activeTab === 'design'} icon={Palette} label="التصميم" onClick={() => setActiveTab('design')} />
              <TabButton active={activeTab === 'integrations'} icon={Link2} label="التكاملات" onClick={() => setActiveTab('integrations')} />
              <TabButton active={activeTab === 'notifications'} icon={Bell} label="الإشعارات" onClick={() => setActiveTab('notifications')} />
            </nav>
          </div>

          {/* المحتوى */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-8">
            
            {/* إعدادات عامة */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Store className="w-6 h-6" /> الإعدادات العامة
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="اسم المتجر (عربي)" value={generalSettings.storeNameAr} 
                    onChange={(e: any) => setGeneralSettings({...generalSettings, storeNameAr: e.target.value})} 
                    placeholder="مثال: متجر الأزياء" />
                  <InputField label="اسم المتجر (English)" value={generalSettings.storeName}
                    onChange={(e: any) => setGeneralSettings({...generalSettings, storeName: e.target.value})}
                    placeholder="Fashion Store" />
                </div>

                <InputField label="رابط المتجر" value={generalSettings.subdomain}
                  onChange={(e: any) => setGeneralSettings({...generalSettings, subdomain: e.target.value})}
                  placeholder="mystore" />

                <ToggleSwitch 
                  enabled={generalSettings.storeEnabled}
                  onChange={() => setGeneralSettings({...generalSettings, storeEnabled: !generalSettings.storeEnabled})}
                  title="حالة المتجر"
                  description="تفعيل أو تعطيل ظهور متجرك للعملاء"
                />

                <button onClick={() => saveSettings('/api/settings/general', generalSettings)} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  <Save className="w-5 h-5" /> {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            )}

            {/* إعدادات التصميم */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Palette className="w-6 h-6" /> إعدادات التصميم
                </h2>

                <div>
                  <label className="block text-sm font-semibold mb-3">الألوان</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600">اللون الأساسي</label>
                      <input type="color" value={designSettings.primaryColor}
                        onChange={(e) => setDesignSettings({...designSettings, primaryColor: e.target.value})}
                        className="w-full h-12 rounded-lg border-2 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">اللون الثانوي</label>
                      <input type="color" value={designSettings.secondaryColor}
                        onChange={(e) => setDesignSettings({...designSettings, secondaryColor: e.target.value})}
                        className="w-full h-12 rounded-lg border-2 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">نمط عرض المنتجات</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['grid', 'list', 'landing'].map((mode) => (
                      <button key={mode}
                        onClick={() => setDesignSettings({...designSettings, productDisplayMode: mode})}
                        className={`p-4 rounded-xl border-2 ${designSettings.productDisplayMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        {mode === 'grid' ? '▦ شبكة' : mode === 'list' ? '☰ قائمة' : '📄 صفحة هبوط'}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => saveSettings('/api/settings/design', designSettings)} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg">
                  <Save className="w-5 h-5" /> {saving ? 'جاري الحفظ...' : 'حفظ التصميم'}
                </button>
              </div>
            )}

            {/* إعدادات التكاملات */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Link2 className="w-6 h-6" /> التكاملات
                </h2>

                <div className="p-6 bg-gradient-to-br from-gray-50 to-pink-50 rounded-2xl border-2">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" /> TikTok API
                  </h3>
                  <InputField label="API Key" value={integrationSettings.tiktokApiKey}
                    onChange={(e: any) => setIntegrationSettings({...integrationSettings, tiktokApiKey: e.target.value})}
                    placeholder="أدخل TikTok API Key" />
                </div>

                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5" /> Facebook Pixel
                  </h3>
                  <InputField label="Pixel ID" value={integrationSettings.facebookPixelId}
                    onChange={(e: any) => setIntegrationSettings({...integrationSettings, facebookPixelId: e.target.value})}
                    placeholder="أدخل Facebook Pixel ID" />
                </div>

                <div className="p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border-2">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5" /> Google Sheets
                  </h3>
                  <InputField label="API Key" value={integrationSettings.googleSheetsApiKey}
                    onChange={(e: any) => setIntegrationSettings({...integrationSettings, googleSheetsApiKey: e.target.value})}
                    placeholder="أدخل Google Sheets API Key" />
                </div>

                <InputField label="Custom Webhook URL" value={integrationSettings.customWebhookUrl}
                  onChange={(e: any) => setIntegrationSettings({...integrationSettings, customWebhookUrl: e.target.value})}
                  placeholder="https://your-webhook-url.com" />

                <button onClick={() => saveSettings('/api/settings/integrations', integrationSettings)} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg">
                  <Save className="w-5 h-5" /> {saving ? 'جاري الحفظ...' : 'حفظ التكاملات'}
                </button>
              </div>
            )}

            {/* إعدادات الإشعارات */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6" /> الإشعارات
                </h2>

                <ToggleSwitch 
                  enabled={notificationSettings.emailNotifications}
                  onChange={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                  title="إشعارات البريد الإلكتروني"
                  description="استقبال إشعارات الطلبات عبر البريد"
                />

                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Telegram Bot
                  </h3>
                  <div className="space-y-4">
                    <InputField label="Bot Token" value={notificationSettings.telegramBotToken}
                      onChange={(e: any) => setNotificationSettings({...notificationSettings, telegramBotToken: e.target.value})}
                      placeholder="أدخل Telegram Bot Token" />
                    <InputField label="Chat ID" value={notificationSettings.telegramChatId}
                      onChange={(e: any) => setNotificationSettings({...notificationSettings, telegramChatId: e.target.value})}
                      placeholder="أدخل Chat ID" />
                  </div>
                </div>

                <InputField label="رسالة الطلب الجديد" value={notificationSettings.newOrderMessage}
                  onChange={(e: any) => setNotificationSettings({...notificationSettings, newOrderMessage: e.target.value})}
                  placeholder="تم استلام طلب جديد!" />

                <button onClick={() => saveSettings('/api/settings/notifications', notificationSettings)} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg">
                  <Save className="w-5 h-5" /> {saving ? 'جاري الحفظ...' : 'حفظ الإشعارات'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
