'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/upload';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
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

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getById(id as string);
      const p = response.data;
      
      setProduct(p);
      setFormData({
        name: p.name || '',
        nameAr: p.nameAr || '',
        description: p.description || '',
        descriptionAr: p.descriptionAr || '',
        price: p.price?.toString() || '',
        comparePrice: p.comparePrice?.toString() || '',
        stock: p.stock?.toString() || '',
        sku: p.sku || '',
        categoryId: p.categoryId || '',
        isActive: p.isActive ?? true,
        isFeatured: p.isFeatured ?? false,
      });
      
      // Set existing images
      if (p.images && Array.isArray(p.images)) {
        setExistingImages(p.images);
      }
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
      
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const url = await uploadImageToImgBB(file);
          newImageUrls.push(url);
        }
      }
      
      // Combine existing + new images
      const allImages = [...existingImages, ...newImageUrls];
      
      const updateData = {
        name: formData.name,
        nameAr: formData.nameAr || formData.name,
        description: formData.description,
        descriptionAr: formData.descriptionAr || formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku || null,
        categoryId: formData.categoryId || null,
        images: allImages,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      await productsApi.update(id as string, updateData);
      alert('✅ تم تحديث المنتج بنجاح!');
      router.push('/merchant/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'حدث خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">تعديل المنتج</h1>
            <p className="text-gray-600">{product?.nameAr || product?.name}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Product Name */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">اسم المنتج *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="اسم المنتج"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">اسم المنتج (عربي)</label>
            <input
              type="text"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="اسم المنتج بالعربية"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">الوصف (English)</label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="اكتب وصف المنتج بالتفصيل..."
            height="250px"
          />
        </div>

        {/* Description Arabic */}
        <div>
          <label className="block text-sm font-semibold mb-2">الوصف (العربية)</label>
          <RichTextEditor
            value={formData.descriptionAr}
            onChange={(value) => setFormData({ ...formData, descriptionAr: value })}
            placeholder="اكتب وصف المنتج بالتفصيل بالعربية..."
            height="250px"
          />
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2">الصور الحالية</label>
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`صورة ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div>
          <label className="block text-sm font-semibold mb-2">إضافة صور جديدة</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">اضغط لرفع الصور</p>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImageFiles(prev => [...prev, ...files]);
                
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                  };
                  reader.readAsDataURL(file);
                });
              }}
            />
          </label>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={preview}
                    alt={`معاينة ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">السعر (دج) *</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-500">السعر قبل الخصم</label>
            <input
              type="number"
              value={formData.comparePrice}
              onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="2000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">المخزون *</label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="100"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="font-semibold">نشط</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="font-semibold">مميز</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
