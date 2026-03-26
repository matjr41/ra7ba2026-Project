'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, ArrowRight, ArrowLeft, Package, Truck,
  MapPin, Phone, Mail, User, CheckCircle, AlertCircle,
  CreditCard, Shield, Clock, Star
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button, Input, Card, Badge } from '@/components/ui';
import LocationSelector from '@/components/LocationSelector';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  images: string[];
  selectedOptions?: Record<string, string>;
}

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  wilaya: string;
  wilayaId?: number;
  commune: string;
  communeId?: number;
  address: string;
  notes: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [store, setStore] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<OrderForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<OrderForm>>({});

  useEffect(() => {
    loadStoreData();
    loadCartFromStorage();
  }, [subdomain]);

  const loadStoreData = async () => {
    try {
      const response = await storefrontApi.getStore(subdomain);
      setStore(response.data);
    } catch (error) {
      console.error('Failed to load store', error);
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

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    if (updatedCart.length === 0) {
      router.push(`/store/${subdomain}`);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const shippingFee = 600;
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee;

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderForm> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'الاسم مطلوب';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'رقم الهاتف مطلوب';
    } else if (!/^(0[567])[0-9]{8}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'رقم هاتف غير صحيح';
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.wilaya) {
      newErrors.wilaya = 'الولاية مطلوبة';
    }

    if (!formData.commune) {
      newErrors.commune = 'البلدية مطلوبة';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        wilaya: formData.wilaya,
        commune: formData.commune,
        address: formData.address,
        notes: formData.notes || undefined,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || {}
        }))
      };

      console.log('🛒 Sending order to:', `/store/${subdomain}/orders`);
      console.log('📦 Order data:', orderData);
      
      const response = await storefrontApi.createOrder(subdomain, orderData);
      console.log('✅ Order created:', response.data);
      
      // Clear cart
      localStorage.removeItem('cart');
      
      toast.success('تم إرسال طلبك بنجاح!');
      
      // Redirect to thank you page
      router.push(`/store/${subdomain}/thank-you?order=${response.data.orderNumber}`);
    } catch (error: any) {
      console.error('❌ Order submission failed:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error config:', error.config);
      toast.error(error.response?.data?.message || 'فشل إرسال الطلب. حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            تم استلام طلبك بنجاح! 🎉
          </h1>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">رقم الطلب</p>
            <p className="text-2xl font-bold text-purple-600">{orderNumber}</p>
          </div>

          <p className="text-gray-600 mb-8">
            سيتم التواصل معك قريباً لتأكيد الطلب والتوصيل
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/store/${subdomain}`)}
              className="w-full"
              size="lg"
            >
              العودة للمتجر
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push(`/track/${orderNumber}`)}
              className="w-full"
              size="lg"
            >
              تتبع الطلب
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/store/${subdomain}`)}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للمتجر
            </Button>

            <h1 className="text-xl font-bold">إتمام الطلب</h1>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">دفع آمن</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'السلة' },
              { num: 2, label: 'المعلومات' },
              { num: 3, label: 'التأكيد' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep >= step.num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span className="mr-2 text-sm font-medium hidden sm:inline">
                  {step.label}
                </span>
                {index < 2 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      currentStep > step.num ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Cart Items */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      محتويات السلة ({cartItems.length} منتج)
                    </h2>

                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="relative w-20 h-20 flex-shrink-0">
                            {item.images?.[0] ? (
                              <Image
                                src={item.images[0]}
                                alt={item.nameAr || item.name}
                                fill
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">
                              {item.nameAr || item.name}
                            </h3>
                            <p className="text-purple-600 font-bold">
                              {formatCurrency(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-bold">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              +
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            حذف
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        size="lg"
                        onClick={() => setCurrentStep(2)}
                        className="px-8"
                      >
                        التالي
                        <ArrowLeft className="w-5 h-5 mr-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      معلومات الشحن والتوصيل
                    </h2>

                    <div className="space-y-4">
                      {/* Customer Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          الاسم الكامل *
                        </label>
                        <Input
                          placeholder="أدخل اسمك الكامل"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className={errors.customerName ? 'border-red-500' : ''}
                        />
                        {errors.customerName && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          رقم الهاتف *
                        </label>
                        <Input
                          placeholder="05XXXXXXXX"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                          className={errors.customerPhone ? 'border-red-500' : ''}
                        />
                        {errors.customerPhone && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          البريد الإلكتروني (اختياري)
                        </label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                          className={errors.customerEmail ? 'border-red-500' : ''}
                        />
                        {errors.customerEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
                        )}
                      </div>

                      {/* Location Selector */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          الولاية والبلدية *
                        </label>
                        <LocationSelector
                          selectedWilaya={formData.wilayaId}
                          selectedCommune={formData.communeId}
                          onWilayaChange={(id, name) => {
                            setFormData({
                              ...formData,
                              wilayaId: id,
                              wilaya: name,
                              communeId: undefined,
                              commune: ''
                            });
                          }}
                          onCommuneChange={(id, name) => {
                            setFormData({
                              ...formData,
                              communeId: id,
                              commune: name
                            });
                          }}
                          required
                        />
                        {errors.wilaya && (
                          <p className="text-red-500 text-sm mt-1">{errors.wilaya}</p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          العنوان التفصيلي *
                        </label>
                        <Input
                          placeholder="الحي، الشارع، رقم المنزل..."
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className={errors.address ? 'border-red-500' : ''}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          ملاحظات (اختياري)
                        </label>
                        <textarea
                          placeholder="أي ملاحظات إضافية للتوصيل..."
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowRight className="w-5 h-5 ml-2" />
                        السابق
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => {
                          if (validateForm()) {
                            setCurrentStep(3);
                          }
                        }}
                      >
                        التالي
                        <ArrowLeft className="w-5 h-5 mr-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      تأكيد الطلب
                    </h2>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h3 className="font-bold mb-3">ملخص الطلب</h3>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between py-2 text-sm">
                          <span>{item.nameAr || item.name} × {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        معلومات التوصيل
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{formData.customerName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{formData.customerPhone}</span>
                        </div>
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{formData.wilaya}، {formData.commune}</span>
                        </div>
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{formData.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-green-50 rounded-xl p-4 mb-6">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        طريقة الدفع
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500" />
                        <span className="font-medium">الدفع عند الاستلام</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCurrentStep(2)}
                        disabled={submitting}
                      >
                        <ArrowRight className="w-5 h-5 ml-2" />
                        السابق
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8"
                      >
                        {submitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full ml-2"
                            />
                            جاري الإرسال...
                          </>
                        ) : (
                          <>
                            تأكيد الطلب
                            <CheckCircle className="w-5 h-5 mr-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">ملخص الطلب</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي</span>
                    <span className="text-purple-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>دفع آمن 100%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>توصيل سريع</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>خدمة عملاء 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>ضمان الجودة</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
