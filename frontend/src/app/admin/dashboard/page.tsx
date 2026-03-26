'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tenantsRes, paymentsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getTenants(),
        adminApi.getPendingPayments(),
      ]);

      // Backend shapes:
      // - getStats(): { tenants: { total, active, trial, suspended }, orders: { total }, revenue: { total }, recentOrders: [...] }
      // - getTenants(): { data: Tenant[], meta: {...} }
      // - getPendingPayments(): Payment[]

      const s = statsRes?.data || {};
      setStats({
        totalTenants: s.tenants?.total ?? 0,
        activeTenants: s.tenants?.active ?? 0,
        trialTenants: s.tenants?.trial ?? 0,
        suspendedTenants: s.tenants?.suspended ?? 0,
        recentOrders: Array.isArray(s.recentOrders) ? s.recentOrders : [],
      });

      const tenantsPayload = tenantsRes?.data;
      const tenantsArray = tenantsPayload && Array.isArray(tenantsPayload.data)
        ? tenantsPayload.data
        : Array.isArray(tenantsPayload)
        ? tenantsPayload
        : [];
      setTenants(tenantsArray);

      const paymentsArray = Array.isArray(paymentsRes?.data) ? paymentsRes.data : [];
      setPendingPayments(paymentsArray);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('هل تريد الموافقة على هذا الدفع؟')) return;

    try {
      await adminApi.approvePayment(paymentId);
      alert('تم الموافقة بنجاح!');
      loadData();
    } catch (error) {
      alert('حدث خطأ في الموافقة');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      await adminApi.rejectPayment(paymentId, reason);
      alert('تم رفض الدفع');
      loadData();
    } catch (error) {
      alert('حدث خطأ في الرفض');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const formatDate = (value: any) => {
    try {
      if (!value) return '—';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('ar-DZ');
    } catch (_) {
      return '—';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-2">🏪</div>
            <div className="text-3xl font-bold mb-1">{stats?.totalTenants || 0}</div>
            <div className="opacity-90">إجمالي المتاجر</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold mb-1">{stats?.activeTenants || 0}</div>
            <div className="opacity-90">متاجر نشطة</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold mb-1">{stats?.trialTenants || 0}</div>
            <div className="opacity-90">فترة تجريبية</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold mb-1">{pendingPayments.length}</div>
            <div className="opacity-90">مدفوعات معلقة</div>
          </div>
        </div>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              💳 مدفوعات تنتظر الموافقة
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                {pendingPayments.length}
              </span>
            </h2>

            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{payment.subscription.tenant.name}</h3>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                          {payment.subscription.plan}
                        </span>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <p>💰 المبلغ: <strong>{payment.amount} دج</strong></p>
                        <p>📧 البريد: {payment.subscription.tenant.owner?.email}</p>
                        {payment.baridimobRef && (
                          <p>🔢 رقم BaridiMob: <strong>{payment.baridimobRef}</strong></p>
                        )}
                        {payment.paymentProof && (
                          <a
                            href={payment.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-block"
                          >
                            📄 عرض إثبات الدفع
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovePayment(payment.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        ✓ موافقة
                      </button>
                      <button
                        onClick={() => handleRejectPayment(payment.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        ✗ رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenants List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">📋 جميع المتاجر</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">المتجر</th>
                  <th className="px-4 py-3 text-right">المالك</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الخطة</th>
                  <th className="px-4 py-3 text-right">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold">{tenant.name}</div>
                        <div className="text-sm text-gray-500">
                          {tenant.subdomain}.rahba.dz
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{tenant.owner?.name ? tenant.owner.name : '—'}</div>
                        <div className="text-gray-500">{tenant.owner?.email ? tenant.owner.email : '—'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : tenant.status === 'TRIAL'
                            ? 'bg-blue-100 text-blue-700'
                            : tenant.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tenant.status ? tenant.status : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tenant.subscription?.plan ? tenant.subscription.plan : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tenant.createdAt ? formatDate(tenant.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
