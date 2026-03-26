'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { merchantApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Save, 
  Facebook, 
  Instagram, 
  BarChart3, 
  Sheet, 
  Camera,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Label, Switch } from '@/components/ui';

export default function MarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    facebookPixelId: '',
    facebookEnabled: false,
    tiktokPixelId: '',
    tiktokEnabled: false,
    googleAnalyticsId: '',
    googleSheetsId: '',
    googleEnabled: false,
    snapchatPixelId: '',
    snapchatEnabled: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await merchantApi.getMarketingIntegration();
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading marketing integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await merchantApi.updateMarketingIntegration(data);
      toast.success('تم حفظ التكاملات التسويقية بنجاح!');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving marketing integrations:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">التكاملات التسويقية</h1>
          <p className="text-gray-600">ربط متجرك مع منصات التسويق والإعلانات</p>
        </div>

        <div className="space-y-6">
          {/* Facebook Pixel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Facebook Pixel</h2>
                  <p className="text-sm text-gray-500">تتبع التحويلات والإعلانات</p>
                </div>
              </div>
              <Switch
                checked={data.facebookEnabled}
                onCheckedChange={(checked) => setData({ ...data, facebookEnabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixelId"
                  placeholder="123456789012345"
                  value={data.facebookPixelId || ''}
                  onChange={(e) => setData({ ...data, facebookPixelId: e.target.value })}
                  disabled={!data.facebookEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  احصل على Pixel ID من Events Manager في Facebook Business
                </p>
              </div>
            </div>
          </div>

          {/* TikTok Pixel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">TikTok Pixel</h2>
                  <p className="text-sm text-gray-500">تتبع إعلانات TikTok</p>
                </div>
              </div>
              <Switch
                checked={data.tiktokEnabled}
                onCheckedChange={(checked) => setData({ ...data, tiktokEnabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tiktokPixelId">TikTok Pixel ID</Label>
                <Input
                  id="tiktokPixelId"
                  placeholder="C1234567890ABCDEF"
                  value={data.tiktokPixelId || ''}
                  onChange={(e) => setData({ ...data, tiktokPixelId: e.target.value })}
                  disabled={!data.tiktokEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  احصل على Pixel ID من TikTok Ads Manager
                </p>
              </div>
            </div>
          </div>

          {/* Google Analytics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Google Analytics & Sheets</h2>
                  <p className="text-sm text-gray-500">تحليلات المتجر والطلبات</p>
                </div>
              </div>
              <Switch
                checked={data.googleEnabled}
                onCheckedChange={(checked) => setData({ ...data, googleEnabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX"
                  value={data.googleAnalyticsId || ''}
                  onChange={(e) => setData({ ...data, googleAnalyticsId: e.target.value })}
                  disabled={!data.googleEnabled}
                />
              </div>

              <div>
                <Label htmlFor="googleSheetsId">Google Sheets ID (اختياري)</Label>
                <Input
                  id="googleSheetsId"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={data.googleSheetsId || ''}
                  onChange={(e) => setData({ ...data, googleSheetsId: e.target.value })}
                  disabled={!data.googleEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  لإرسال الطلبات تلقائياً إلى Google Sheets
                </p>
              </div>
            </div>
          </div>

          {/* Snapchat Pixel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Snapchat Pixel</h2>
                  <p className="text-sm text-gray-500">تتبع إعلانات Snapchat</p>
                </div>
              </div>
              <Switch
                checked={data.snapchatEnabled}
                onCheckedChange={(checked) => setData({ ...data, snapchatEnabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="snapchatPixelId">Snapchat Pixel ID</Label>
                <Input
                  id="snapchatPixelId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={data.snapchatPixelId || ''}
                  onChange={(e) => setData({ ...data, snapchatPixelId: e.target.value })}
                  disabled={!data.snapchatEnabled}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg"
            >
              <Save className="w-5 h-5 ml-2" />
              {saving ? 'جاري الحفظ...' : 'حفظ جميع التكاملات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
