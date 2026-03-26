'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShoppingCart, ArrowRight, Package, Truck, MapPin, Phone, User, CheckCircle, Home, Building2
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import toast from 'react-hot-toast';

const ALGERIA_WILAYAS = [
  '01 - أدرار', '02 - الشلف', '03 - الأغواط', '04 - أم البواقي', '05 - باتنة', '06 - بجاية', '07 - بسكرة', '08 - بشار',
  '09 - البليدة', '10 - البويرة', '11 - تمنراست', '12 - تبسة', '13 - تلمسان', '14 - تيارت', '15 - تيزي وزو', '16 - الجزائر',
  '17 - الجلفة', '18 - جيجل', '19 - سطيف', '20 - سعيدة', '21 - سكيكدة', '22 - سيدي بلعباس', '23 - عنابة', '24 - قالمة',
  '25 - قسنطينة', '26 - المدية', '27 - مستغانم', '28 - المسيلة', '29 - معسكر', '30 - ورقلة', '31 - وهران', '32 - البيض',
  '33 - إليزي', '34 - برج بوعريريج', '35 - بومرداس', '36 - الطارف', '37 - تندوف', '38 - تيسمسيلت', '39 - الوادي',
  '40 - خنشلة', '41 - سوق أهراس', '42 - تيبازة', '43 - ميلة', '44 - عين الدفلى', '45 - النعامة', '46 - عين تموشنت',
  '47 - غرداية', '48 - غليزان', '49 - تيميمون', '50 - برج باجي مختار', '51 - أولاد جلال', '52 - بني عباس',
  '53 - عين صالح', '54 - عين قزام', '55 - تقرت', '56 - جانت', '57 - المغير', '58 - المنيعة',
];

export default function ImprovedCheckout() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [store, setStore] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadStoreData();
    loadCartFromStorage();
  }, [subdomain]);

  useEffect(() => {
    if (selectedWilaya && store?.shippingConfig) {
      calculateShippingFee();
    }
  }, [selectedWilaya, deliveryType, store]);

  const loadStoreData = async () => {
    try {
      const response = await storefrontApi.getStore(subdomain);
      setStore(response.data);
    } catch (error) {
      toast.error('فشل تحميل بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const items = JSON.parse(saved);
        setCartItems(items);
        if (items.length === 0) {
          router.push(`/store/${subdomain}`);
        }
      } else {
        router.push(`/store/${subdomain}`);
      }
    } catch (error) {
      console.error('Failed to load cart', error);
    }
  };

  const calculateShippingFee = () => {
    if (!store?.shippingConfig) {
      setShippingFee(500); // Default
      return;
    }

    const config = store.shippingConfig;
    const wilayaCode = selectedWilaya.split(' - ')[0];
    const wilayaConfig = config.wilayas?.find((w: any) => w.wilayaCode === wilayaCode);

    if (wilayaConfig) {
      if (wilayaConfig.freeShipping) {
        setShippingFee(0);
      } else if (deliveryType === 'home') {
        setShippingFee(wilayaConfig.homeDeliveryPrice || 500);
      } else {
        setShippingFee(wilayaConfig.deskDeliveryPrice || 350);
      }
    } else {
      // Use default prices
      setShippingFee(deliveryType === 'home' ? 500 : 350);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingFee;
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'الاسم مطلوب';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'رقم الهاتف مطلوب';
    if (!selectedWilaya) newErrors.wilaya = 'الولاية مطلوبة';
    if (!formData.address.trim()) newErrors.address = 'العنوان مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        wilaya: selectedWilaya,
        commune: formData.commune,
        address: formData.address,
        notes: formData.notes,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await storefrontApi.createOrder(subdomain, orderData);
      
      setOrderNumber(response.data.orderNumber);
      setOrderSuccess(true);
      localStorage.removeItem('cart');
      
      toast.success('تم إرسال طلبك بنجاح! 🎉');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-600 mb-2">رقم الطلب:</p>
          <p className="text-2xl font-bold text-indigo-600 mb-6">{orderNumber}</p>
          {store?.thankYouMessage && (
            <p className="text-gray-700 mb-6">{store.thankYouMessage}</p>
          )}
          <p className="text-sm text-gray-500 mb-8">سيتم التواصل معك قريباً لتأكيد الطلب</p>
          <button
            onClick={() => router.push(`/store/${subdomain}`)}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            العودة إلى المتجر
          </button>
        </motion.div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إتمام الطلب</h1>
          <p className="text-gray-600">املأ البيانات لإكمال طلبك</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">معلومات العميل</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.customerName ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="أحمد محمد"
                    />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف *</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.customerPhone ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="0555123456"
                    />
                    {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">معلومات الشحن</h2>
                </div>

                {/* Delivery Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">نوع التوصيل</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('home')}
                      className={`p-4 rounded-xl border-2 transition-all ${deliveryType === 'home' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      <Home className={`w-6 h-6 mx-auto mb-2 ${deliveryType === 'home' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className={`font-semibold ${deliveryType === 'home' ? 'text-indigo-600' : 'text-gray-600'}`}>التوصيل للمنزل</p>
                      <p className="text-xs text-gray-500 mt-1">{shippingFee > 0 ? `${shippingFee} دج` : 'مجاني'}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('desk')}
                      className={`p-4 rounded-xl border-2 transition-all ${deliveryType === 'desk' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      <Building2 className={`w-6 h-6 mx-auto mb-2 ${deliveryType === 'desk' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className={`font-semibold ${deliveryType === 'desk' ? 'text-indigo-600' : 'text-gray-600'}`}>مكتب الشحن</p>
                      <p className="text-xs text-gray-500 mt-1">{shippingFee > 0 ? `${shippingFee} دج` : 'مجاني'}</p>
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الولاية *</label>
                    <select
                      value={selectedWilaya}
                      onChange={(e) => {
                        setSelectedWilaya(e.target.value);
                        setFormData({ ...formData, wilaya: e.target.value });
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.wilaya ? 'border-red-500' : 'border-gray-200'}`}
                    >
                      <option value="">اختر الولاية</option>
                      {ALGERIA_WILAYAS.map((wilaya) => (
                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                      ))}
                    </select>
                    {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البلدية</label>
                    <input
                      type="text"
                      value={formData.commune}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="اسم البلدية"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الكامل *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                      rows={3}
                      placeholder="الشارع، الحي، رقم المنزل..."
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                      rows={2}
                      placeholder="أي ملاحظات خاصة بالطلب..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? 'جاري الإرسال...' : (
                  <>
                    <span>تأكيد الطلب</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">ملخص الطلب</h2>
              </div>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    {item.images?.[0] && (
                      <Image
                        src={item.images[0]}
                        alt={item.nameAr}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{item.nameAr}</p>
                      <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      <p className="text-sm font-bold text-indigo-600">{(item.price * item.quantity).toLocaleString()} دج</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>رسوم الشحن:</span>
                  <span className="font-semibold">{shippingFee === 0 ? 'مجاني' : `${shippingFee.toLocaleString()} دج`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-100">
                  <span>المجموع الكلي:</span>
                  <span className="text-indigo-600">{total.toLocaleString()} دج</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                <p className="text-xs text-indigo-800 text-center">
                  الدفع عند الاستلام 💵
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
