'use client';

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};


import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { uploadImageToImgBB } from '@/lib/upload';
import { Package, Plus, Upload, X, Image as ImageIcon, Bold, Italic, List, Link2, Heading, Code, AlignLeft, AlignCenter, AlignRight, Underline, Strikethrough, ListOrdered, Quote, Minus, Tag, Percent, Layers, Copy, ChevronRight, ChevronLeft, Check, Eye, Truck, Ruler, BarChart3, Award, Search, Sparkles, Save, Zap } from 'lucide-react';
import ProductPreview from '@/components/products/ProductPreview';
import ImageUploader from '@/components/products/ImageUploader';
import VariantsTable from '@/components/products/VariantsTable';
import RichTextEditor from '@/components/editor/RichTextEditor';

export default function MerchantProducts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: '',
    sku: '',
    images: [] as string[],
    variants: [] as any[],
    variantCombinations: [] as any[],
    category: '',
    tags: '',
    isOffer: false,
    offerPrice: '',
    offerEndDate: '',
    isLandingPage: false,
    whatsappNumber: '',
    showWhatsappButton: false,
    isActive: true,
    isFeatured: false,
    // SEO
    seoTitle: '',
    seoDescription: '',
    slug: '',
    // الشحن والأبعاد
    weight: '',
    weightUnit: 'kg' as 'kg' | 'g',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'cm' as 'cm' | 'm',
    shippingFee: '',
    freeShipping: false,
    // المخزون المتقدم
    lowStockAlert: '',
    allowBackorder: false,
    barcode: '',
    // التسعير المتدرج
    bulkPricing: [] as Array<{ min: number; max: number; price: number }>,
    // الشارات
    badges: [] as string[],
    // المنتجات المرتبطة
    relatedProducts: [] as string[],
    crossSellProducts: [] as string[],
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [availableBadges] = useState(['جديد', 'الأكثر مبيعاً', 'محدود', 'حصري', 'عرض ساخن', 'توصية']);

  useEffect(() => {
    loadProducts();
  }, []);

  // الحفظ التلقائي
  useEffect(() => {
    if (!showAddModal) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('ra7ba:product:draft', JSON.stringify(formData));
        setLastSaved(new Date());
      } catch (e) {}
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData, showAddModal]);

  // استرجاع المسودة
  useEffect(() => {
    if (showAddModal) {
      try {
        const draft = localStorage.getItem('ra7ba:product:draft');
        if (draft && confirm('هل تريد استرجاع المسودة المحفوظة؟')) {
          setFormData(JSON.parse(draft));
        }
      } catch (e) {}
    }
  }, [showAddModal]);

  // توليد Slug تلقائي
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^\w\s-\u0600-\u06ff]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        const url = await uploadImageToImgBB(file);
        urls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    return urls;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // إدارة الخطوات
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // إضافة/حذف شارة
  const toggleBadge = (badge: string) => {
    setFormData(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge]
    }));
  };

  // إضافة تسعير متدرج
  const addBulkPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, { min: 1, max: 10, price: 0 }]
    }));
  };

  const removeBulkPricingTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bulkPricing: prev.bulkPricing.filter((_, i) => i !== index)
    }));
  };

  const updateBulkPricingTier = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bulkPricing: prev.bulkPricing.map((tier, i) =>
        i === index ? { ...tier, [field]: parseFloat(value) || 0 } : tier
      )
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', values: [''], price: '', stock: '' }]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadingImages(true);
      
      // Upload images first
      const imageUrls = await uploadImages(imageFiles);
      
      const productData = {
        name: formData.name,
        nameAr: formData.name, // استخدام نفس الاسم مؤقتاً
        description: formData.description,
        descriptionAr: formData.description, // استخدام نفس الوصف مؤقتاً
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku || undefined,
        categoryId: formData.category || undefined, // إرسال undefined عند عدم اختيار تصنيف
        images: imageUrls,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        // SEO
        slug: formData.slug || undefined,
        metaTitle: formData.seoTitle || undefined,
        metaDescription: formData.seoDescription || undefined,
        // Shipping
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        weightUnit: formData.weightUnit || undefined,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        dimensionUnit: formData.dimensionUnit || undefined,
        shippingFee: formData.shippingFee ? parseFloat(formData.shippingFee) : undefined,
        freeShipping: formData.freeShipping || false,
        // Stock alerts
        lowStockAlert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : undefined,
        allowBackorder: formData.allowBackorder || false,
        // JSON fields
        bulkPricing: formData.bulkPricing || undefined,
        badges: formData.badges || undefined,
        relatedProducts: formData.relatedProducts || undefined,
        crossSellProducts: formData.crossSellProducts || undefined,
      };

      await productsApi.create(productData);
      alert('تم إضافة المنتج بنجاح!');
      resetForm();
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ في إضافة المنتج');
    } finally {
      setUploadingImages(false);
    }
  };

  const resetForm = () => {
    setShowAddModal(false);
    setCurrentStep(1);
    setShowPreview(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      stock: '',
      sku: '',
      images: [],
      variants: [],
      variantCombinations: [],
      category: '',
      tags: '',
      isOffer: false,
      offerPrice: '',
      offerEndDate: '',
      isLandingPage: false,
      whatsappNumber: '',
      showWhatsappButton: false,
      isActive: true,
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
      slug: '',
      weight: '',
      weightUnit: 'kg' as 'kg' | 'g',
      length: '',
      width: '',
      height: '',
      dimensionUnit: 'cm' as 'cm' | 'm',
      shippingFee: '',
      freeShipping: false,
      lowStockAlert: '',
      allowBackorder: false,
      barcode: '',
      bulkPricing: [],
      badges: [],
      relatedProducts: [],
      crossSellProducts: [],
    });
    setImageFiles([]);
    setImagePreviews([]);
    setShowVariants(false);
    try {
      localStorage.removeItem('ra7ba:product:draft');
    } catch (e) {}
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;

    try {
      await productsApi.delete(id);
      alert('تم حذف المنتج');
      loadProducts();
    } catch (error) {
      alert('حدث خطأ في الحذف');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            المنتجات
          </h1>
          <p className="text-gray-600 mt-2">إدارة منتجات متجرك</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          إضافة منتج
        </button>
      </div>

      <div>
        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold mb-2">لا توجد منتجات بعد</h3>
            <p className="text-gray-600 mb-6">ابدأ بإضافة أول منتج لمتجرك</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              إضافة منتج الآن
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.nameAr}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{product.nameAr}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {stripHtml(product.descriptionAr || product.description || '')}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="text-sm text-gray-600">
                      المخزون: <strong>{product.stock}</strong>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/merchant/products/${product.id}/edit`)}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          name: product.nameAr + ' (نسخة)',
                          description: product.descriptionAr || '',
                          price: product.price?.toString() || '',
                          stock: product.stock?.toString() || '',
                          category: product.category || '',
                        });
                        setShowAddModal(true);
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                      title="نسخ المنتج"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      title="حذف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">إضافة منتج جديد</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="أدخل اسم المنتج بأي لغة تريد"
                />
              </div>

              {/* Rich Text Description - WYSIWYG Editor */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  الوصف التفصيلي
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="اكتب وصف المنتج بالتفصيل... استخدم شريط الأدوات للتنسيق وإضافة الصور"
                  height="350px"
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  صور المنتج (متعددة)
                </label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">اضغط لرفع الصور</span> أو اسحب وأفلت
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setImageFiles(prev => [...prev, ...files]);
                        
                        // Create previews
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

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreviews(prev => prev.filter((_, i) => i !== index));
                              setImageFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                              رئيسية
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    السعر (دج) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-500">
                    السعر قبل الخصم
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    المخزون *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    التصنيف
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">اختر تصنيف</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    رمز المنتج (SKU)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="PROD-001"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  الوسوم (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="جديد، عرض، مميز"
                />
              </div>

              {/* Offer Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="isOffer"
                    checked={formData.isOffer}
                    onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <label htmlFor="isOffer" className="font-semibold flex items-center gap-2">
                    <Percent className="w-5 h-5 text-orange-600" />
                    هذا المنتج عرض خاص
                  </label>
                </div>
                {formData.isOffer && (
                  <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        سعر العرض (دج) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.offerPrice}
                        onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                        className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="1200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        تاريخ انتهاء العرض
                      </label>
                      <input
                        type="date"
                        value={formData.offerEndDate}
                        onChange={(e) => setFormData({ ...formData, offerEndDate: e.target.value })}
                        className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    المتغيرات (المقاسات، الألوان، إلخ)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVariants(!showVariants)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {showVariants ? 'إخفاء' : 'إضافة متغيرات'}
                  </button>
                </div>
                {showVariants && (
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">متغير #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="الاسم (مثلاً: اللون)"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            placeholder="القيم (أحمر، أزرق)"
                            value={variant.values.join(', ')}
                            onChange={(e) => updateVariant(index, 'values', e.target.value.split(',').map(v => v.trim()))}
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addVariant}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة متغير جديد
                    </button>
                  </div>
                )}
              </div>

              {/* Landing Page Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="isLandingPage"
                    checked={formData.isLandingPage}
                    onChange={(e) => setFormData({ ...formData, isLandingPage: e.target.checked })}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <label htmlFor="isLandingPage" className="font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    عرض كصفحة هبوط (Landing Page)
                  </label>
                </div>
                {formData.isLandingPage && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-green-700">
                      ✨ صفحة الهبوط تخفي كل عناصر الموقع وتركز فقط على المنتج مع زر "اطلب الآن" احترافي
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showWhatsapp"
                        checked={formData.showWhatsappButton}
                        onChange={(e) => setFormData({ ...formData, showWhatsappButton: e.target.checked })}
                        className="w-4 h-4 accent-green-600"
                      />
                      <label htmlFor="showWhatsapp" className="text-sm font-medium">
                        إظهار زر واتساب
                      </label>
                    </div>
                    {formData.showWhatsappButton && (
                      <input
                        type="tel"
                        placeholder="رقم الواتساب (مثال: 213555123456)"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingImages ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      إضافة المنتج
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">إضافة تصنيف جديد</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              placeholder="اسم التصنيف"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
              <button
                onClick={addCategory}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
