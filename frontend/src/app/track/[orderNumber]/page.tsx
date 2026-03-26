'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TrackOrderPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.orderNumber) {
      loadOrder();
    }
  }, [params.orderNumber]);

  const loadOrder = async () => {
    try {
      const { data } = await ordersApi.trackOrder(params.orderNumber as string);
      setOrder(data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'الطلب غير موجود');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'SHIPPED': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'في انتظار التأكيد';
      case 'CONFIRMED': return 'تم التأكيد';
      case 'SHIPPED': return 'تم الشحن';
      case 'DELIVERED': return 'تم التسليم';
      case 'CANCELLED': return 'ملغي';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">خطأ</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">📦 تتبع الطلب</h1>
            <p className="text-gray-600 mt-2">رقم الطلب: #{order?.orderNumber}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Order Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(order?.status)}`}>
              {getStatusText(order?.status)}
            </div>
            <div className="mt-4 text-gray-600">
              آخر تحديث: {formatDate(order?.updatedAt)}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="flex justify-between items-center mb-8">
            {[
              { key: 'PENDING', label: 'تم الطلب', icon: '📝' },
              { key: 'CONFIRMED', label: 'تم التأكيد', icon: '✅' },
              { key: 'SHIPPED', label: 'تم الشحن', icon: '🚚' },
              { key: 'DELIVERED', label: 'تم التسليم', icon: '🎉' }
            ].map((step, index) => {
              const isActive = order?.status === step.key;
              const isPassed = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(order?.status) >= index;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    isPassed ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  <div className={`mt-2 text-sm font-semibold ${
                    isActive ? 'text-purple-600' : isPassed ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">معلومات العميل</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">الاسم:</span>
                <span className="font-semibold mr-2">{order?.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">الهاتف:</span>
                <span className="font-semibold mr-2">{order?.customerPhone}</span>
              </div>
              <div>
                <span className="text-gray-600">العنوان:</span>
                <div className="mt-1">
                  <div className="font-semibold">{order?.shippingAddress}</div>
                  <div className="text-sm text-gray-600">
                    {order?.commune}, {order?.wilaya}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">ملخص الطلب</h2>
            <div className="space-y-3 mb-4">
              {order?.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <div className="font-semibold">{item.product.nameAr}</div>
                    <div className="text-sm text-gray-600">الكمية: {item.quantity}</div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">الإجمالي:</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(order?.totalAmount)}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                + رسوم التوصيل: {formatCurrency(order?.shippingCost || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Info */}
        {order?.trackingNumber && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">معلومات الشحن</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <div className="font-semibold">رقم التتبع</div>
                  <div className="font-mono text-lg">{order.trackingNumber}</div>
                  {order.deliveryCompany && (
                    <div className="text-sm text-gray-600">
                      شركة التوصيل: {order.deliveryCompany}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order?.customerNotes && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">ملاحظات العميل</h2>
            <p className="text-gray-700">{order.customerNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
