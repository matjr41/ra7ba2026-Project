'use client';

import { useState } from 'react';
import { Sparkles, Save, Plus, Trash2, Edit2, Star, Gift, MessageSquare, Tag } from 'lucide-react';

export default function StorefrontSettings() {
  const [saving, setSaving] = useState(false);
  
  // عروض الموسم
  const [seasonalOffers, setSeasonalOffers] = useState([
    {
      id: '1',
      title: 'عروض الموسم',
      subtitle: 'عروض حصرية',
      description: 'استفد من خصومات تصل إلى 35% على باقات المنتجات المختارة لمدة محدودة.',
      features: ['منتجات أصلية مع ضمان شامل', 'توصيل مجاني للطلبات فوق 10,000 دج', 'خدمة ما بعد البيع ممتازة'],
      buttonText: 'اكتشف الخصومات الآن',
      enabled: true,
    }
  ]);

  // الآراء والتقييمات
  const [reviews, setReviews] = useState([
    {
      id: '1',
      customerName: 'أحمد محمد',
      rating: 5,
      comment: 'منتجات ممتازة وخدمة رائعة! أنصح بالشراء من هذا المتجر',
      date: '2024-01-15',
      productName: 'منتج تجريبي',
      enabled: true,
    }
  ]);

  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editingReview, setEditingReview] = useState<any>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: استدعاء API لحفظ الإعدادات
      alert('تم حفظ الإعدادات بنجاح! ✅');
    } catch (error) {
      alert('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    const newOffer = {
      id: Date.now().toString(),
      title: 'عرض جديد',
      subtitle: 'عرض مميز',
      description: 'وصف العرض',
      features: ['ميزة 1'],
      buttonText: 'اكتشف المزيد',
      enabled: true,
    };
    setSeasonalOffers([...seasonalOffers, newOffer]);
  };

  const deleteOffer = (id: string) => {
    if (confirm('هل تريد حذف هذا العرض؟')) {
      setSeasonalOffers(seasonalOffers.filter(o => o.id !== id));
    }
  };

  const updateOffer = (id: string, field: string, value: any) => {
    setSeasonalOffers(seasonalOffers.map(o => 
      o.id === id ? {...o, [field]: value} : o
    ));
  };

  const addFeatureToOffer = (offerId: string) => {
    setSeasonalOffers(seasonalOffers.map(o => 
      o.id === offerId ? {...o, features: [...o.features, 'ميزة جديدة']} : o
    ));
  };

  const updateFeature = (offerId: string, featureIndex: number, value: string) => {
    setSeasonalOffers(seasonalOffers.map(o => {
      if (o.id === offerId) {
        const newFeatures = [...o.features];
        newFeatures[featureIndex] = value;
        return {...o, features: newFeatures};
      }
      return o;
    }));
  };

  const deleteFeature = (offerId: string, featureIndex: number) => {
    setSeasonalOffers(seasonalOffers.map(o => {
      if (o.id === offerId) {
        return {...o, features: o.features.filter((_, i) => i !== featureIndex)};
      }
      return o;
    }));
  };

  const addReview = () => {
    const newReview = {
      id: Date.now().toString(),
      customerName: 'عميل جديد',
      rating: 5,
      comment: 'تعليق العميل',
      date: new Date().toISOString().split('T')[0],
      productName: 'منتج',
      enabled: true,
    };
    setReviews([...reviews, newReview]);
  };

  const deleteReview = (id: string) => {
    if (confirm('هل تريد حذف هذا التقييم؟')) {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  const updateReview = (id: string, field: string, value: any) => {
    setReviews(reviews.map(r => 
      r.id === id ? {...r, [field]: value} : r
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">واجهة المتجر</h1>
            <p className="text-gray-600">إدارة العروض والتقييمات</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* عروض الموسم */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">عروض الموسم</h2>
          </div>
          <button
            onClick={addOffer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة عرض
          </button>
        </div>

        <div className="space-y-6">
          {seasonalOffers.map((offer, offerIndex) => (
            <div key={offer.id} className="border-2 border-gray-200 rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500">#{offerIndex + 1}</span>
                  <button
                    onClick={() => updateOffer(offer.id, 'enabled', !offer.enabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      offer.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      offer.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    offer.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {offer.enabled ? 'مفعّل' : 'معطّل'}
                  </span>
                </div>
                <button
                  onClick={() => deleteOffer(offer.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان الرئيسي</label>
                    <input
                      type="text"
                      value={offer.title}
                      onChange={(e) => updateOffer(offer.id, 'title', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                      placeholder="عروض الموسم"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان الفرعي</label>
                    <input
                      type="text"
                      value={offer.subtitle}
                      onChange={(e) => updateOffer(offer.id, 'subtitle', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                      placeholder="عروض حصرية"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={offer.description}
                    onChange={(e) => updateOffer(offer.id, 'description', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all min-h-[80px]"
                    placeholder="وصف العرض..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">المميزات</label>
                    <button
                      onClick={() => addFeatureToOffer(offer.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      + إضافة ميزة
                    </button>
                  </div>
                  {offer.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(offer.id, idx, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                        placeholder="ميزة العرض"
                      />
                      <button
                        onClick={() => deleteFeature(offer.id, idx)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">نص الزر</label>
                  <input
                    type="text"
                    value={offer.buttonText}
                    onChange={(e) => updateOffer(offer.id, 'buttonText', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                    placeholder="اكتشف المزيد"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* الآراء والتقييمات */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">آراء العملاء</h2>
          </div>
          <button
            onClick={addReview}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة تقييم
          </button>
        </div>

        <div className="space-y-4">
          {reviews.map((review, reviewIndex) => (
            <div key={review.id} className="border-2 border-gray-200 rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500">#{reviewIndex + 1}</span>
                  <button
                    onClick={() => updateReview(review.id, 'enabled', !review.enabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      review.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      review.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    review.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {review.enabled ? 'ظاهر' : 'مخفي'}
                  </span>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">اسم العميل</label>
                    <input
                      type="text"
                      value={review.customerName}
                      onChange={(e) => updateReview(review.id, 'customerName', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                      placeholder="أحمد محمد"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">التقييم</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateReview(review.id, 'rating', star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التعليق</label>
                  <textarea
                    value={review.comment}
                    onChange={(e) => updateReview(review.id, 'comment', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all min-h-[80px]"
                    placeholder="تعليق العميل..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المنتج</label>
                    <input
                      type="text"
                      value={review.productName}
                      onChange={(e) => updateReview(review.id, 'productName', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                      placeholder="منتج تجريبي"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={review.date}
                      onChange={(e) => updateReview(review.id, 'date', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button Bottom */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
        </button>
      </div>
    </div>
  );
}
