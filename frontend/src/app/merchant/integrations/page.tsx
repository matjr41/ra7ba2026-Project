'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Switch } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { merchantApi } from '@/lib/api';
import { Send, Facebook, Zap, Sheet, Save, ExternalLink } from 'lucide-react';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<any>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await merchantApi.getIntegrations();
      setIntegrations(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحميل إعدادات التطبيقات');
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrations = async () => {
    setSaving(true);
    try {
      await merchantApi.updateIntegrations(integrations);
      toast.success('✅ تم حفظ إعدادات التطبيقات بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateIntegration = (type: string, field: string, value: any) => {
    setIntegrations({
      ...integrations,
      [type]: {
        ...integrations[type],
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التطبيقات والربط</h1>
          <p className="text-gray-600 mt-1">ربط متجرك مع التطبيقات الخارجية</p>
        </div>
        <Button onClick={saveIntegrations} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Telegram Bot */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Telegram Bot</CardTitle>
                  <CardDescription>استقبال إشعارات الطلبات على تيليجرام</CardDescription>
                </div>
              </div>
              <Switch
                checked={integrations?.telegram?.enabled}
                onCheckedChange={(checked) => updateIntegration('telegram', 'enabled', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-start gap-3">
                <Send className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 mb-1">🤖 البوت الموحد @ra7ba1_bot</p>
                  <p className="text-gray-700">
                    تستخدم المنصة بوت تيليجرام موحد لجميع التجار. كل ما تحتاجه هو إضافة Chat ID الخاص بك لتلقي الإشعارات.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold">Chat ID *</Label>
              <Input
                value={integrations?.telegram?.chatId || ''}
                onChange={(e) => updateIntegration('telegram', 'chatId', e.target.value)}
                placeholder="123456789"
                disabled={!integrations?.telegram?.enabled}
                className="text-lg py-6"
              />
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">الخطوة 1:</span>
                  ابحث عن البوت 
                  <a href="https://t.me/ra7ba1_bot" target="_blank" className="text-blue-600 underline font-semibold">
                    @ra7ba1_bot
                  </a>
                  وابدأ محادثة معه
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">الخطوة 2:</span>
                  احصل على Chat ID من
                  <a href="https://t.me/userinfobot" target="_blank" className="text-blue-600 underline font-semibold">
                    @userinfobot
                  </a>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">الخطوة 3:</span>
                  الصق Chat ID أعلاه وفعّل الإشعارات
                </p>
              </div>
            </div>
            
            {integrations?.telegram?.enabled && integrations?.telegram?.chatId && (
              <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  ✅ سيتم إرسال إشعار فوري لك على تيليجرام عند كل طلب جديد
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  البوت الموحد @ra7ba1_bot سيرسل لك الإشعارات مع عزل كامل لمتجرك
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facebook Pixel */}
        <Card className="border-2 border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-lg">
                  <Facebook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Facebook Pixel</CardTitle>
                  <CardDescription>تتبع الزوار والمبيعات على فيسبوك</CardDescription>
                </div>
              </div>
              <Switch
                checked={integrations?.facebookPixel?.enabled}
                onCheckedChange={(checked) => updateIntegration('facebookPixel', 'enabled', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <Input
                value={integrations?.facebookPixel?.pixelId || ''}
                onChange={(e) => updateIntegration('facebookPixel', 'pixelId', e.target.value)}
                placeholder="123456789012345"
                disabled={!integrations?.facebookPixel?.enabled}
              />
              <p className="text-xs text-gray-600 mt-1">
                احصل على Pixel ID من{' '}
                <a href="https://business.facebook.com/events_manager2" target="_blank" className="text-indigo-500 underline">
                  Facebook Events Manager
                </a>
              </p>
            </div>
            {integrations?.facebookPixel?.enabled && integrations?.facebookPixel?.pixelId && (
              <div className="bg-indigo-100 p-3 rounded-lg">
                <p className="text-sm font-medium text-indigo-900">✅ سيتم تتبع PageView, AddToCart, Purchase تلقائياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TikTok Pixel */}
        <Card className="border-2 border-pink-200 bg-pink-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-600 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>TikTok Pixel</CardTitle>
                  <CardDescription>تتبع الزوار والمبيعات على تيك توك</CardDescription>
                </div>
              </div>
              <Switch
                checked={integrations?.tiktokPixel?.enabled}
                onCheckedChange={(checked) => updateIntegration('tiktokPixel', 'enabled', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <Input
                value={integrations?.tiktokPixel?.pixelId || ''}
                onChange={(e) => updateIntegration('tiktokPixel', 'pixelId', e.target.value)}
                placeholder="ABCDEFGHIJK123456789"
                disabled={!integrations?.tiktokPixel?.enabled}
              />
              <p className="text-xs text-gray-600 mt-1">
                احصل على Pixel ID من{' '}
                <a href="https://ads.tiktok.com/i18n/events_manager" target="_blank" className="text-pink-500 underline">
                  TikTok Events Manager
                </a>
              </p>
            </div>
            {integrations?.tiktokPixel?.enabled && integrations?.tiktokPixel?.pixelId && (
              <div className="bg-pink-100 p-3 rounded-lg">
                <p className="text-sm font-medium text-pink-900">✅ سيتم تتبع PageView, AddToCart, CompletePayment تلقائياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Sheets */}
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600 rounded-lg">
                  <Sheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Google Sheets</CardTitle>
                  <CardDescription>مزامنة الطلبات مع Google Sheets</CardDescription>
                </div>
              </div>
              <Switch
                checked={integrations?.googleSheets?.enabled}
                onCheckedChange={(checked) => updateIntegration('googleSheets', 'enabled', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sheet ID</Label>
              <Input
                value={integrations?.googleSheets?.sheetId || ''}
                onChange={(e) => updateIntegration('googleSheets', 'sheetId', e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                disabled={!integrations?.googleSheets?.enabled}
              />
              <p className="text-xs text-gray-600 mt-1">
                Sheet ID من رابط Google Sheet (الجزء بعد /d/)
              </p>
            </div>
            <div>
              <Label>Service Account Email</Label>
              <Input
                value={integrations?.googleSheets?.serviceAccountEmail || ''}
                onChange={(e) => updateIntegration('googleSheets', 'serviceAccountEmail', e.target.value)}
                placeholder="service-account@project-id.iam.gserviceaccount.com"
                disabled={!integrations?.googleSheets?.enabled}
              />
              <p className="text-xs text-gray-600 mt-1">
                احصل عليه من{' '}
                <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" className="text-green-500 underline">
                  Google Cloud Console
                </a>
              </p>
            </div>
            {integrations?.googleSheets?.enabled && integrations?.googleSheets?.sheetId && (
              <div className="bg-green-100 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-900">✅ سيتم إضافة الطلبات الجديدة تلقائياً إلى Google Sheet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 نصيحة</h3>
        <p className="text-sm text-yellow-800">
          قم بتفعيل Telegram Bot لتلقي إشعارات فورية عند كل طلب جديد. 
          استخدم Facebook و TikTok Pixel لتتبع نجاح إعلاناتك.
          اربط Google Sheets للحصول على نسخة احتياطية من طلباتك.
        </p>
      </div>
    </div>
  );
}
