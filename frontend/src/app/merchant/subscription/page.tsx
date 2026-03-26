'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { subscriptionApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

type Plan = {
  id: string;
  nameAr: string;
  price: number;
  featuresAr: string[];
};

type PaymentData = {
  payerEmail: string;
  paymentProof: string;
  proofFile: File | null;
};

export default function MerchantSubscription() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentData>({
    payerEmail: '',
    paymentProof: '',
    proofFile: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        subscriptionApi.getCurrent(),
        subscriptionApi.getPlans(),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image upload handled via shared utility (ImgBB)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setPaymentData((prev: PaymentData) => ({ ...prev, proofFile: file, paymentProof: '' }));
    } else {
      setPaymentData((prev: PaymentData) => ({ ...prev, proofFile: null }));
    }
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();

    if (!paymentData.payerEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني الخاص بالمتجر');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(paymentData.payerEmail.trim())) {
      alert('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    if (!paymentData.proofFile && !paymentData.paymentProof.trim()) {
      alert('يرجى رفع صورة لإثبات الدفع أو إدخال رابط صالح');
      return;
    }

    try {
      const plan = plans.find((p: Plan) => p.id === selectedPlan);
      if (!plan) {
        alert('يرجى اختيار خطة صالحة قبل إرسال الطلب');
        return;
      }

      const formData = new FormData();
      formData.append('plan', selectedPlan.toUpperCase());
      formData.append('payerEmail', paymentData.payerEmail.trim());

      if (paymentData.proofFile) {
        formData.append('proofFile', paymentData.proofFile);
      } else if (paymentData.paymentProof.trim()) {
        formData.append('paymentProof', paymentData.paymentProof.trim());
      }

      if (!formData.has('proofFile') && !formData.has('paymentProof')) {
        alert('تعذر قراءة ملف إثبات الدفع. يرجى المحاولة من جديد.');
        return;
      }

      await subscriptionApi.submitPayment(formData);
      
      alert('تم إرسال طلب الدفع بنجاح! سيتم مراجعته بين نصف ساعة إلى ساعة.');
      setShowPaymentModal(false);
      setPaymentData({ payerEmail: '', paymentProof: '', proofFile: null });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ في إرسال الطلب');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/merchant/dashboard" className="text-gray-600 hover:text-purple-600">
              ← الرئيسية
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">💎 الاشتراك والفواتير</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Current Subscription */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">اشتراكك الحالي</h2>
              <div className="space-y-2 text-lg">
                <div>
                  الخطة:{' '}
                  <strong className="text-2xl">
                    {subscription?.plan === 'STANDARD'
                      ? 'Standard'
                      : subscription?.plan === 'PRO'
                      ? 'Pro'
                      : 'تجريبي'}
                  </strong>
                </div>
                <div>
                  الحالة:{' '}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      subscription?.status === 'ACTIVE'
                        ? 'bg-green-400 text-green-900'
                        : subscription?.status === 'TRIAL'
                        ? 'bg-blue-400 text-blue-900'
                        : 'bg-red-400 text-red-900'
                    }`}
                  >
                    {subscription?.status}
                  </span>
                </div>
                {subscription?.currentPeriodEnd && (
                  <div>
                    صالح حتى: <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="text-6xl">💳</div>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8">اختر خطتك 🚀</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg p-8 border-2 ${
                  plan.id === 'pro' ? 'border-purple-500 relative' : 'border-gray-200'
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                    ⭐ الأكثر شعبية
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.nameAr}</h3>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-gray-600">شهرياً</div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.featuresAr.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setShowPaymentModal(true);
                  }}
                  className={`w-full py-3 rounded-lg font-bold transition ${
                    plan.id === 'pro'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  اختيار هذه الخطة
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">📋 سجل المدفوعات</h2>
          {subscription?.payments?.length > 0 ? (
            <div className="space-y-3">
              {subscription.payments.map((payment: any) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        payment.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">لا توجد مدفوعات</p>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-bold mb-6">إرسال إثبات الدفع</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-2">طريقة الدفع - BaridiMob 📱</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. افتح تطبيق BaridiMob</li>
                <li>2. أرسل المبلغ إلى: <strong>00799999002619174321</strong></li>
                <li>3. التقط صورة (لقطة شاشة) لتأكيد الدفع</li>
                <li>4. ارفع الصورة أدناه</li>
              </ol>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  البريد الإلكتروني المرتبط بالدفع *
                </label>
                <input
                  type="email"
                  required
                  value={paymentData.payerEmail}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, payerEmail: e.target.value }))
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  إثبات الدفع - لقطة الشاشة *
                </label>
                
                {/* File Upload */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📸 ارفع لقطة شاشة من تطبيق BaridiMob (أقل من 5 ميجابايت)
                  </p>
                </div>

                {/* Preview */}
                {paymentData.proofFile && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-green-800">
                        تم اختيار الملف: {paymentData.proofFile.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Alternative URL input */}
                <div className="text-center text-sm text-gray-500 mb-2">أو</div>
                <input
                  type="url"
                  value={paymentData.paymentProof}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentProof: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="🔗 رابط الصورة (اختياري)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  إرسال للموافقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
