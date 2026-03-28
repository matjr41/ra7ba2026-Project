'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/upload';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// تحميل المحرر ديناميكياً فقط من جهة العميل
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nameAr: '',
    descriptionAr: '',
    price: '',
    comparePrice: '',
    stock: '',
    sku: '',
    categoryId: '',
    isActive: true,
    isFeatured: false,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        productsApi.getById(id as string),
        productsApi.getCategories?.() || Promise.resolve({ data: [] }),
      ]);
      const p = pRes.data;
      setProduct(p);
      if (Array.isArray(cRes?.data)) setCategories(cRes.data);
      setFormData({
        nameAr: p.nameAr || p.name || '',
        descriptionAr: p.descriptionAr || p.description || '',
        price: p.price?.toString() || '',
        comparePrice: p.comparePrice?.toString() || '',
        stock: p.stock?.toString() || '',
        sku: p.sku || '',
        categoryId: p.categoryId || '',
        isActive: p.isActive ?? true,
        isFeatured: p.isFeatured ?? false,
      });
      if (p.images && Array.isArray(p.images)) setExistingImages(p.images);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('خطأ في تحميل المنتج');
      router.push('/merchant/products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      let newImageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImageToImgBB(file);
        newImageUrls.push(url);
      }
      const allImages = [...existingImages, ...newImageUrls];
      await productsApi.update(id as string, {
        name: formData.nameAr,
        nameAr: formData.nameAr,
        description: formData.descriptionAr,
        descriptionAr: formData.descriptionAr,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku || null,
        categoryId: formData.categoryId || null,
        images: allImages,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      });
      alert('✅ تم تحديث المنتج بنجاح!');
      router.push('/merchant/products');
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-500">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-sm";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">تعديل المنتج</h1>
          <p className="text-gray-500 text-sm mt-0.5">{product?.nameAr || product?.name}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-5">

        {/* Name */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className={labelClass}>اسم المنتج *</label>
          <input type="text" required value={formData.nameAr}
            onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
            className={inputClass} placeholder="اسم المنتج بالعربية" />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className={labelClass}>وصف المنتج</label>
          <RichTextEditor
            value={formData.descriptionAr}
            onChange={v => setFormData({ ...formData, descriptionAr: v })}
            placeholder="اكتب وصف المنتج بالتفصيل..."
            height="220px"
          />
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <label className={labelClass}>الصور</label>

          {/* Existing */}
          {existingImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-xl border" />
                  <button type="button" onClick={() => setExistingImages(p => p.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-purple-300 transition">
            <Upload className="w-7 h-7 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">اضغط لرفع صور جديدة</p>
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files || []);
                setImageFiles(p => [...p, ...files]);
                files.forEach(f => {
                  const r = new FileReader();
                  r.onloadend = () => setImagePreviews(p => [...p, r.result as string]);
                  r.readAsDataURL(f);
                });
              }} />
          </label>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img src={preview} alt="" className="w-full h-full object-cover rounded-xl border-2 border-green-400" />
                  <button type="button" onClick={() => {
                    setImageFiles(p => p.filter((_, i) => i !== idx));
                    setImagePreviews(p => p.filter((_, i) => i !== idx));
                  }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price & Stock */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>السعر (دج) *</label>
              <input type="number" required value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className={inputClass} placeholder="1500" min="0" />
            </div>
            <div>
              <label className={labelClass}>السعر قبل الخصم</label>
              <input type="number" value={formData.comparePrice}
                onChange={e => setFormData({ ...formData, comparePrice: e.target.value })}
                className={inputClass} placeholder="2000" min="0" />
            </div>
            <div>
              <label className={labelClass}>المخزون</label>
              <input type="number" value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className={inputClass} placeholder="100" min="0" />
            </div>
          </div>
        </div>

        {/* Category & SKU */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>التصنيف</label>
              <select value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className={inputClass}>
                <option value="">بدون تصنيف</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>رمز المنتج (SKU)</label>
              <input type="text" value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className={inputClass} placeholder="SKU-001" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 accent-purple-600" />
              <span className="font-semibold text-sm">نشط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-purple-600" />
              <span className="font-semibold text-sm">مميز</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => router.back()}
            className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition font-semibold">
            إلغاء
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 px-6 py-3.5 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</> : <><Save className="w-5 h-5" /> حفظ التغييرات</>}
          </button>
        </div>
      </form>
    </div>
  );
}
