'use client';

import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface Variant {
  name: string;
  options: string[];
}

interface VariantCombination {
  combination: string;
  price: string;
  stock: string;
  sku: string;
  image?: string;
  enabled: boolean;
}

interface VariantsTableProps {
  variants: Variant[];
  combinations: VariantCombination[];
  onVariantsChange: (variants: Variant[]) => void;
  onCombinationsChange: (combinations: VariantCombination[]) => void;
}

export default function VariantsTable({
  variants,
  combinations,
  onVariantsChange,
  onCombinationsChange,
}: VariantsTableProps) {
  const addVariant = () => {
    onVariantsChange([...variants, { name: '', options: [''] }]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onVariantsChange(newVariants);
    generateCombinations(newVariants);
  };

  const updateVariantName = (index: number, name: string) => {
    const newVariants = [...variants];
    newVariants[index].name = name;
    onVariantsChange(newVariants);
  };

  const updateVariantOptions = (index: number, options: string) => {
    const newVariants = [...variants];
    newVariants[index].options = options.split(',').map(o => o.trim()).filter(Boolean);
    onVariantsChange(newVariants);
    generateCombinations(newVariants);
  };

  const generateCombinations = (vars: Variant[]) => {
    if (vars.length === 0 || vars.some(v => v.options.length === 0)) {
      onCombinationsChange([]);
      return;
    }

    const generate = (current: string[], index: number): string[][] => {
      if (index === vars.length) {
        return [current];
      }
      const results: string[][] = [];
      for (const option of vars[index].options) {
        results.push(...generate([...current, option], index + 1));
      }
      return results;
    };

    const allCombinations = generate([], 0);
    const newCombinations: VariantCombination[] = allCombinations.map(combo => {
      const comboStr = combo.join(' / ');
      const existing = combinations.find(c => c.combination === comboStr);
      return existing || {
        combination: comboStr,
        price: '',
        stock: '',
        sku: '',
        enabled: true,
      };
    });

    onCombinationsChange(newCombinations);
  };

  const updateCombination = (index: number, field: keyof VariantCombination, value: any) => {
    const newCombinations = [...combinations];
    newCombinations[index] = { ...newCombinations[index], [field]: value };
    onCombinationsChange(newCombinations);
  };

  return (
    <div className="space-y-4">
      {/* إضافة المتغيرات */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">تعريف المتغيرات</h4>
        {variants.map((variant, index) => (
          <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">متغير #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-600 hover:text-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="اسم المتغير (مثلاً: اللون، المقاس)"
                value={variant.name}
                onChange={(e) => updateVariantName(index, e.target.value)}
                className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="الخيارات مفصولة بفاصلة (أحمر، أزرق، أخضر)"
                value={variant.options.join(', ')}
                onChange={(e) => updateVariantOptions(index, e.target.value)}
                className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addVariant}
          className="w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة متغير جديد
        </button>
      </div>

      {/* جدول التوليفات */}
      {combinations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">
            التوليفات ({combinations.length})
          </h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">التوليفة</th>
                  <th className="px-4 py-3 text-right font-semibold">السعر</th>
                  <th className="px-4 py-3 text-right font-semibold">المخزون</th>
                  <th className="px-4 py-3 text-right font-semibold">SKU</th>
                  <th className="px-4 py-3 text-right font-semibold">صورة</th>
                  <th className="px-4 py-3 text-center font-semibold">مفعل</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combo, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{combo.combination}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        placeholder="السعر"
                        value={combo.price}
                        onChange={(e) => updateCombination(index, 'price', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        placeholder="المخزون"
                        value={combo.stock}
                        onChange={(e) => updateCombination(index, 'stock', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="SKU"
                        value={combo.sku}
                        onChange={(e) => updateCombination(index, 'sku', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-700"
                        title="إضافة صورة"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={combo.enabled}
                        onChange={(e) => updateCombination(index, 'enabled', e.target.checked)}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
