'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Label, Button } from '@/components/ui';
import { Palette, Type, Save } from 'lucide-react';

interface ThemeCustomizerProps {
  currentTheme: any;
  onSave: (theme: any) => void;
}

const PRESET_COLORS = [
  { name: 'بنفسجي', value: '#8B5CF6' },
  { name: 'أزرق', value: '#3B82F6' },
  { name: 'أخضر', value: '#10B981' },
  { name: 'أحمر', value: '#EF4444' },
  { name: 'برتقالي', value: '#F59E0B' },
  { name: 'وردي', value: '#EC4899' },
  { name: 'أزرق فاتح', value: '#06B6D4' },
  { name: 'أخضر داكن', value: '#059669' },
];

const FONTS = [
  { name: 'Cairo', value: 'cairo', arabicName: 'القاهرة' },
  { name: 'Tajawal', value: 'tajawal', arabicName: 'تجول' },
  { name: 'Almarai', value: 'almarai', arabicName: 'المرعي' },
  { name: 'IBM Plex Sans Arabic', value: 'ibm', arabicName: 'IBM' },
  { name: 'Noto Sans Arabic', value: 'noto', arabicName: 'Noto' },
  { name: 'Amiri', value: 'amiri', arabicName: 'أميري' },
];

export default function ThemeCustomizer({ currentTheme, onSave }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState({
    mode: currentTheme?.mode || 'dark',
    primaryColor: currentTheme?.primaryColor || '#8B5CF6',
    secondaryColor: currentTheme?.secondaryColor || '#3B82F6',
    accentColor: currentTheme?.accentColor || '#10B981',
    fontFamily: currentTheme?.fontFamily || 'cairo',
    fontSize: currentTheme?.fontSize || 'medium',
    borderRadius: currentTheme?.borderRadius || 'medium',
  });

  const updateTheme = (key: string, value: any) => {
    setTheme({ ...theme, [key]: value });
  };

  const handleSave = () => {
    onSave(theme);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            الوضع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateTheme('mode', 'light')}
              className={`p-6 rounded-xl border-2 transition-all ${theme.mode === 'light' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
            >
              <div className="w-full h-24 bg-white border-2 border-gray-200 rounded-lg mb-3"></div>
              <p className={`font-semibold ${theme.mode === 'light' ? 'text-indigo-600' : 'text-gray-600'}`}>فاتح</p>
            </button>

            <button
              onClick={() => updateTheme('mode', 'dark')}
              className={`p-6 rounded-xl border-2 transition-all ${theme.mode === 'dark' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
            >
              <div className="w-full h-24 bg-gray-900 border-2 border-gray-700 rounded-lg mb-3"></div>
              <p className={`font-semibold ${theme.mode === 'dark' ? 'text-indigo-600' : 'text-gray-600'}`}>داكن</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            الألوان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Color */}
          <div>
            <Label className="mb-3 block">اللون الأساسي</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateTheme('primaryColor', color.value)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${theme.primaryColor === color.value ? 'border-gray-900 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg"
                placeholder="#8B5CF6"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <Label className="mb-3 block">اللون الثانوي</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label className="mb-3 block">لون التمييز</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => updateTheme('accentColor', e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => updateTheme('accentColor', e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg"
                placeholder="#10B981"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            الخطوط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block">نوع الخط</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => updateTheme('fontFamily', font.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${theme.fontFamily === font.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  style={{ fontFamily: font.name }}
                >
                  <p className={`font-semibold ${theme.fontFamily === font.value ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {font.arabicName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{font.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">حجم الخط</Label>
            <div className="grid grid-cols-3 gap-3">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => updateTheme('fontSize', size)}
                  className={`p-3 rounded-xl border-2 transition-all ${theme.fontSize === size ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <p className={`font-semibold ${theme.fontSize === size ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {size === 'small' && 'صغير'}
                    {size === 'medium' && 'متوسط'}
                    {size === 'large' && 'كبير'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">استدارة الحواف</Label>
            <div className="grid grid-cols-3 gap-3">
              {['none', 'medium', 'large'].map((radius) => (
                <button
                  key={radius}
                  onClick={() => updateTheme('borderRadius', radius)}
                  className={`p-3 rounded-xl border-2 transition-all ${theme.borderRadius === radius ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div
                    className="w-12 h-12 bg-indigo-600 mx-auto mb-2"
                    style={{
                      borderRadius: radius === 'none' ? '0' : radius === 'medium' ? '8px' : '16px',
                    }}
                  />
                  <p className={`text-sm font-semibold ${theme.borderRadius === radius ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {radius === 'none' && 'بدون'}
                    {radius === 'medium' && 'متوسط'}
                    {radius === 'large' && 'كبير'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة التصميم</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-xl border-2"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#1F2937' : '#FFFFFF',
              color: theme.mode === 'dark' ? '#F3F4F6' : '#1F2937',
              borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'medium' ? '12px' : '24px',
            }}
          >
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                color: theme.primaryColor,
                fontSize: theme.fontSize === 'small' ? '1.25rem' : theme.fontSize === 'large' ? '2rem' : '1.5rem',
              }}
            >
              مرحباً بك في متجرنا
            </h3>
            <p className="mb-4" style={{ fontSize: theme.fontSize === 'small' ? '0.875rem' : theme.fontSize === 'large' ? '1.125rem' : '1rem' }}>
              هذه معاينة لكيفية ظهور متجرك مع التصميم الجديد
            </p>
            <div className="flex gap-2">
              <button
                className="px-6 py-2 text-white font-semibold"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'medium' ? '8px' : '12px',
                }}
              >
                زر أساسي
              </button>
              <button
                className="px-6 py-2 text-white font-semibold"
                style={{
                  backgroundColor: theme.secondaryColor,
                  borderRadius: theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'medium' ? '8px' : '12px',
                }}
              >
                زر ثانوي
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full gap-2" size="lg">
        <Save className="w-4 h-4" />
        حفظ التصميم
      </Button>
    </div>
  );
}
