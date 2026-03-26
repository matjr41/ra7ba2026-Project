'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Store, Search, Filter, Eye, Ban, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminMerchantsPage() {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadMerchants();
  }, [statusFilter]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getTenants(1, 50, statusFilter || undefined);
      setMerchants(data?.data || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    const reason = prompt('سبب الإيقاف:');
    if (!reason) return;

    try {
      await adminApi.suspendTenant(tenantId, reason);
      alert('تم إيقاف المتجر بنجاح');
      loadMerchants();
    } catch (error) {
      alert('حدث خطأ في الإيقاف');
    }
  };

  const handleActivate = async (tenantId: string) => {
    if (!confirm('هل تريد تفعيل هذا المتجر؟')) return;

    try {
      await adminApi.activateTenant(tenantId);
      alert('تم تفعيل المتجر بنجاح');
      loadMerchants();
    } catch (error) {
      alert('حدث خطأ في التفعيل');
    }
  };

  const filteredMerchants = merchants.filter(merchant =>
    merchant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المتاجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Store className="h-8 w-8 text-blue-600" />
          إدارة المتاجر
        </h1>
        <p className="text-gray-600 mt-2">عرض وإدارة جميع المتاجر المسجلة في المنصة</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="بحث بالاسم، النطاق، أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="TRIAL">تجريبي</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="EXPIRED">منتهي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">إجمالي المتاجر</p>
          <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">نشط</p>
          <p className="text-2xl font-bold text-green-600">
            {merchants.filter(m => m.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">تجريبي</p>
          <p className="text-2xl font-bold text-blue-600">
            {merchants.filter(m => m.status === 'TRIAL').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">موقوف</p>
          <p className="text-2xl font-bold text-red-600">
            {merchants.filter(m => m.status === 'SUSPENDED').length}
          </p>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المتجر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المالك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاشتراك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد متاجر مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                          <div className="text-sm text-gray-500">{merchant.subdomain}.rahba.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{merchant.owner?.name || '—'}</div>
                      <div className="text-sm text-gray-500">{merchant.owner?.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          merchant.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : merchant.status === 'TRIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : merchant.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {merchant.status === 'ACTIVE' && '✓ نشط'}
                        {merchant.status === 'TRIAL' && '⏳ تجريبي'}
                        {merchant.status === 'SUSPENDED' && '⛔ موقوف'}
                        {merchant.status === 'EXPIRED' && '⏰ منتهي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {merchant.subscription?.plan || 'بدون اشتراك'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(merchant.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/store/${merchant.subdomain}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="معاينة المتجر"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {merchant.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleActivate(merchant.id)}
                            className="text-green-600 hover:text-green-900"
                            title="تفعيل"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(merchant.id)}
                            className="text-red-600 hover:text-red-900"
                            title="إيقاف"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
