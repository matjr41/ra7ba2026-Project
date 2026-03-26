'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storefrontApi } from '@/lib/api';
import { ALGERIA_WILAYAS } from '@/data/algeria-wilayas';
import { ShoppingCart, Truck, Home, Building2, Package, MapPin, Phone, User, FileText, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [shippingFee, setShippingFee] = useState(500);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [subdomain]);

  useEffect(() => {
    calculateShipping();
  }, [formData.wilaya, deliveryType]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load cart from localStorage
      const cartKey = `cart_${subdomain}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      // Load store data
      const storeRes = await storefrontApi.getStore(subdomain);
      setStore(storeRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = () => {
    if (!formData.wilaya) {
      setShippingFee(deliveryType === 'home' ? 500 : 350);
      return;
    }

    // هنا يمكن جلب السعر من الـ Backend حسب الولاية
    // لكن الآن سنستخدم القيم الافتراضية
    setShippingFee(deliveryType === 'home' ? 500 : 350);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerPhone || !formData.wilaya || !formData.address) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (cart.length === 0) {
      alert('السلة فارغة!');
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        wilaya: formData.wilaya,
        commune: formData.commune || formData.wilaya,
        address: formData.address,
        notes: formData.notes,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await storefrontApi.createOrder(subdomain, orderData);

      // Clear cart
      localStorage.removeItem(`cart_${subdomain}`);

      // Redirect to success page
      router.push(`/store/${subdomain}/order-success?orderId=${response.data.id}`);
    } catch (error: any) {
      console.error('Order error:', error);
      alert(error.response?.data?.message || 'حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🛒 إتمام الطلب
          </h1>
          <p className="text-purple-200 text-lg">{store?.nameAr || store?.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border border-white/20 shadow-2xl space-y-6">
              
              {/* معلومات العميل */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6" />
                  معلومات العميل
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">رقم الهاتف *</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                        placeholder="0555123456"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* نوع التوصيل */}
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                  <Truck className="w-6 h-6" />
                  نوع التوصيل
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      deliveryType === 'home'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-white text-white scale-105 shadow-lg'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <Home className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">توصيل للمنزل</div>
                    <div className="text-sm mt-1">{shippingFee} دج</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('desk')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      deliveryType === 'desk'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-white text-white scale-105 shadow-lg'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">مكتب الشحن</div>
                    <div className="text-sm mt-1">{shippingFee} دج</div>
                  </button>
                </div>
              </div>

              {/* العنوان */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  عنوان التوصيل
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">الولاية *</label>
                    <select
                      required
                      value={formData.wilaya}
                      onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                    >
                      <option value="" className="text-gray-900">اختر الولاية</option>
                      {ALGERIA_WILAYAS.map((wilaya) => (
                        <option key={wilaya.id} value={wilaya.name} className="text-gray-900">
                          {wilaya.code} - {wilaya.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">البلدية</label>
                    <input
                      type="text"
                      value={formData.commune}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      placeholder="اختياري"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">العنوان بالتفصيل *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none"
                    placeholder="أدخل العنوان الكامل..."
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">ملاحظات إضافية</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none"
                    placeholder="أي ملاحظات خاصة بالطلب..."
                  />
                </div>
              </div>

              {/* زر الإرسال */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-2xl hover:scale-105 transform"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري إرسال الطلب...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    تأكيد الطلب
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                ملخص الطلب
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.length === 0 ? (
                  <p className="text-white/60 text-center py-8">السلة فارغة</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex gap-3 bg-white/10 rounded-lg p-3 border border-white/20">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">{item.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/60 text-sm">الكمية: {item.quantity}</span>
                          <span className="text-pink-300 font-bold">{item.price * item.quantity} دج</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-white/20 pt-4">
                <div className="flex justify-between text-white">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{subtotal.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>رسوم الشحن:</span>
                  <span className="font-bold">{shippingFee.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold border-t border-white/20 pt-3">
                  <span>المجموع الكلي:</span>
                  <span className="text-pink-300">{total.toLocaleString()} دج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
