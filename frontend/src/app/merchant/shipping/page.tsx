'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { toast } from 'react-hot-toast';
import { merchantApi } from '@/lib/api';
import { Truck, Save, Building2, Home, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function ShippingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [searchWilaya, setSearchWilaya] = useState('');
  const [expandedWilayas, setExpandedWilayas] = useState<string[]>([]);

  useEffect(() => {
    loadShippingConfig();
  }, []);

  const loadShippingConfig = async () => {
    try {
      const data = await merchantApi.getShippingConfig();
      setConfig(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحميل إعدادات الشحن');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await merchantApi.updateShippingConfig(config);
      toast.success('✅ تم حفظ إعدادات الشحن بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateWilaya = (wilayaCode: string, field: string, value: any) => {
    if (!config?.wilayas) return;

    const updatedWilayas = config.wilayas.map((wilaya: any) => {
      if (wilaya.wilayaCode !== wilayaCode) {
        return wilaya;
      }

      const updated = { ...wilaya };

      if (field === 'homeDeliveryPrice' || field === 'deskDeliveryPrice') {
        if (value === '' || value === null) {
          updated[field] = undefined;
        } else {
          const numericValue = Number(value);
          updated[field] = Number.isFinite(numericValue) ? numericValue : undefined;
        }
      } else if (field === 'freeShipping') {
        updated.freeShipping = Boolean(value);
        if (updated.freeShipping) {
          updated.homeDeliveryPrice = 0;
          updated.deskDeliveryPrice = 0;
        }
      } else if (field === 'isActive') {
        updated.isActive = Boolean(value);
      } else {
        updated[field] = value;
      }

      return updated;
    });

    setConfig({ ...config, wilayas: updatedWilayas });
  };

  const updateCompany = (index: number, field: string, value: any) => {
    const updatedCompanies = [...config.shippingCompanies];
    updatedCompanies[index] = { ...updatedCompanies[index], [field]: value };
    setConfig({ ...config, shippingCompanies: updatedCompanies });
  };

  const toggleWilayaDetails = (wilayaCode: string) => {
    setExpandedWilayas((prev) =>
      prev.includes(wilayaCode)
        ? prev.filter((code) => code !== wilayaCode)
        : [...prev, wilayaCode],
    );
  };

  const filteredWilayas = (config?.wilayas ?? []).filter((wilaya: any) => {
    if (!searchWilaya.trim()) return true;
    const term = searchWilaya.trim().toLowerCase();
    const nameMatch = wilaya.wilayaName?.toLowerCase()?.includes(term);
    const codeMatch = wilaya.wilayaCode?.includes(term);
    const communeMatch = Array.isArray(wilaya.communes)
      ? wilaya.communes.some((commune: any) =>
          commune?.name?.toLowerCase()?.includes(term) || commune?.nameAr?.toLowerCase()?.includes(term),
        )
      : false;

    return nameMatch || codeMatch || communeMatch;
  });

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
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات الشحن</h1>
          <p className="text-gray-600 mt-1">إدارة أسعار الشحن وشركات التوصيل</p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <Tabs defaultValue="wilayas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wilayas" className="gap-2">
            <Truck className="w-4 h-4" />
            أسعار الولايات
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="w-4 h-4" />
            شركات الشحن
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Home className="w-4 h-4" />
            الإعدادات العامة
          </TabsTrigger>
        </TabsList>

        {/* تبويب أسعار الولايات */}
        <TabsContent value="wilayas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أسعار الشحن لجميع الولايات (58 ولاية)</CardTitle>
              <CardDescription>
                حدد أسعار التوصيل للمنزل ومكتب الشحن لكل ولاية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <div className="relative w-full md:w-80">
                    <Input
                      value={searchWilaya}
                      onChange={(e) => setSearchWilaya(e.target.value)}
                      placeholder="ابحث عن ولاية أو بلدية..."
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-500">
                    إجمالي الولايات: {config?.wilayas?.length ?? 0} — تم العثور على {filteredWilayas.length}
                  </p>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-medium">الولاية</th>
                      <th className="text-center p-3 font-medium">التوصيل للمنزل (دج)</th>
                      <th className="text-center p-3 font-medium">مكتب الشحن (دج)</th>
                      <th className="text-center p-3 font-medium">شحن مجاني</th>
                      <th className="text-center p-3 font-medium">مفعل</th>
                      <th className="text-center p-3 font-medium">البلديات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWilayas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          لا توجد ولايات مطابقة لبحثك
                        </td>
                      </tr>
                    )}
                    {filteredWilayas.map((wilaya: any) => {
                      const isExpanded = expandedWilayas.includes(wilaya.wilayaCode);

                      return (
                        <>
                          <tr key={wilaya.wilayaCode} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <span className="font-medium">{wilaya.wilayaCode}</span> - {wilaya.wilayaName}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={wilaya.homeDeliveryPrice ?? 0}
                                min={0}
                                onChange={(e) => updateWilaya(wilaya.wilayaCode, 'homeDeliveryPrice', e.target.value)}
                                className="text-center"
                                disabled={wilaya.freeShipping}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={wilaya.deskDeliveryPrice ?? 0}
                                min={0}
                                onChange={(e) => updateWilaya(wilaya.wilayaCode, 'deskDeliveryPrice', e.target.value)}
                                className="text-center"
                                disabled={wilaya.freeShipping}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Switch
                                checked={wilaya.freeShipping}
                                onCheckedChange={(checked) => updateWilaya(wilaya.wilayaCode, 'freeShipping', checked)}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Switch
                                checked={wilaya.isActive}
                                onCheckedChange={(checked) => updateWilaya(wilaya.wilayaCode, 'isActive', checked)}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleWilayaDetails(wilaya.wilayaCode)}
                                className="gap-1"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {wilaya.communes?.length || 0}
                                <span className="hidden sm:inline">بلدية</span>
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${wilaya.wilayaCode}-details`}>
                              <td colSpan={6} className="bg-gray-50 p-4">
                                {Array.isArray(wilaya.communes) && wilaya.communes.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {wilaya.communes.map((commune: any) => (
                                      <span
                                        key={commune.id || commune.name}
                                        className="px-3 py-1 bg-white border rounded-full text-sm text-gray-700 shadow-sm"
                                      >
                                        {commune.name} {commune.postalCode ? `- ${commune.postalCode}` : ''}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">لا توجد بلديات مسجلة لهذه الولاية.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب شركات الشحن */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>شركات الشحن (10 شركات)</CardTitle>
              <CardDescription>
                أضف معلومات شركات الشحن التي تعمل معها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.shippingCompanies?.map((company: any, index: number) => (
                <Card key={company.id} className="border-2">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">شركة {company.id}</Label>
                      <Switch
                        checked={company.isActive}
                        onCheckedChange={(checked) => updateCompany(index, 'isActive', checked)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>اسم الشركة</Label>
                        <Input
                          value={company.name}
                          onChange={(e) => updateCompany(index, 'name', e.target.value)}
                          placeholder="مثال: ياليدين"
                        />
                      </div>
                      <div>
                        <Label>API Key</Label>
                        <Input
                          value={company.apiKey}
                          onChange={(e) => updateCompany(index, 'apiKey', e.target.value)}
                          placeholder="مفتاح API"
                        />
                      </div>
                      <div>
                        <Label>API Secret</Label>
                        <Input
                          type="password"
                          value={company.apiSecret}
                          onChange={(e) => updateCompany(index, 'apiSecret', e.target.value)}
                          placeholder="سر API"
                        />
                      </div>
                      <div>
                        <Label>Webhook URL</Label>
                        <Input
                          value={company.webhookUrl}
                          onChange={(e) => updateCompany(index, 'webhookUrl', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>ملاحظات</Label>
                        <Input
                          value={company.notes}
                          onChange={(e) => updateCompany(index, 'notes', e.target.value)}
                          placeholder="ملاحظات إضافية..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات العامة */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة للشحن</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-lg">تفعيل التوصيل للمنزل</Label>
                  <p className="text-sm text-gray-600">السماح للعملاء بطلب التوصيل للمنزل</p>
                </div>
                <Switch
                  checked={config?.enableHomeDelivery}
                  onCheckedChange={(checked) => setConfig({ ...config, enableHomeDelivery: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-lg">تفعيل التوصيل لمكتب الشحن</Label>
                  <p className="text-sm text-gray-600">السماح للعملاء بالاستلام من مكتب الشحن</p>
                </div>
                <Switch
                  checked={config?.enableDeskDelivery}
                  onCheckedChange={(checked) => setConfig({ ...config, enableDeskDelivery: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>السعر الافتراضي للتوصيل للمنزل (دج)</Label>
                  <Input
                    type="number"
                    value={config?.defaultHomeDeliveryPrice}
                    onChange={(e) => setConfig({ ...config, defaultHomeDeliveryPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>السعر الافتراضي لمكتب الشحن (دج)</Label>
                  <Input
                    type="number"
                    value={config?.defaultDeskDeliveryPrice}
                    onChange={(e) => setConfig({ ...config, defaultDeskDeliveryPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
