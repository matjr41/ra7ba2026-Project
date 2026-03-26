'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const { data } = await adminApi.getPendingPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الدفع؟')) return;
    
    try {
      await adminApi.approvePayment(paymentId);
      alert('تم قبول الدفع بنجاح!');
      loadPayments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    
    try {
      await adminApi.rejectPayment(paymentId, reason);
      alert('تم رفض الدفع');
      loadPayments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ');
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
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-purple-600">
              ← لوحة التحكم
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">💳 إدارة المدفوعات</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Pending Payments */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">المدفوعات في انتظار الموافقة ({payments.length})</h2>
          </div>

          {payments.length > 0 ? (
            <div className="divide-y">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Merchant Info */}
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-900">
                          {payment.subscription?.tenant?.name || 'غير محدد'}
                        </h3>
                        <p className="text-gray-600">
                          {payment.subscription?.tenant?.owner?.name} - {payment.subscription?.tenant?.owner?.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          📱 {payment.subscription?.tenant?.owner?.phone}
                        </p>
                      </div>

                      {/* Payment Details */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">المبلغ</div>
                          <div className="font-bold text-lg text-green-600">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">تاريخ الإرسال</div>
                          <div className="font-semibold">
                            {formatDate(payment.createdAt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">رقم BaridiMob</div>
                          <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {payment.baridimobRef || 'غير محدد'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">الخطة المطلوبة</div>
                          <div className="font-semibold">
                            {payment.subscription?.plan || 'غير محدد'}
                          </div>
                        </div>
                      </div>

                      {/* Payment Proof */}
                      {payment.paymentProof && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">إثبات الدفع</div>
                          <a
                            href={payment.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            عرض الصورة 🔗
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(payment.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        ✅ موافقة
                      </button>
                      <button
                        onClick={() => handleReject(payment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                      >
                        ❌ رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                لا توجد مدفوعات في انتظار الموافقة
              </h3>
              <p className="text-gray-600">
                جميع المدفوعات تم معالجتها
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
