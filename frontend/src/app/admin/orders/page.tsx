'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Calendar, Eye, Package, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, tenantsResponse] = await Promise.all([
        adminApi.getAllOrders({ search: searchTerm, tenantId: filterTenant, status: filterStatus }),
        adminApi.getTenants(),
      ]);
      
      setOrders(ordersResponse.data.data.map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt).toLocaleString('ar-DZ'),
        items: o.itemsCount || 0,
        total: Number(o.total),
      })));
      
      setTenants(tenantsResponse.data.tenants || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PROCESSING': return 'bg-purple-100 text-purple-700';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'قيد الانتظار';
      case 'CONFIRMED': return 'مؤكد';
      case 'PROCESSING': return 'قيد المعالجة';
      case 'SHIPPED': return 'تم الشحن';
      case 'DELIVERED': return 'تم التسليم';
      case 'CANCELLED': return 'ملغي';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.includes(searchTerm) ||
                         order.customerPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesTenant = filterTenant === 'all' || order.tenant.id === filterTenant;
    return matchesSearch && matchesStatus && matchesTenant;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING').length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
        <p className="text-gray-600">جميع طلبات جميع المتاجر في مكان واحد</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
              <h3 className="text-3xl font-bold text-gray-900">{filteredOrders.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">قيد الانتظار</p>
              <h3 className="text-3xl font-bold text-gray-900">{pendingOrders}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">تم التسليم</p>
              <h3 className="text-3xl font-bold text-gray-900">{deliveredOrders}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} دج</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب أو اسم العميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
            />
          </div>

          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
          >
            <option value="all">جميع المتاجر</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
          >
            <option value="all">جميع الحالات</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="CONFIRMED">مؤكد</option>
            <option value="PROCESSING">قيد المعالجة</option>
            <option value="SHIPPED">تم الشحن</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">رقم الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">العميل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المتجر</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الولاية</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">العناصر</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">التاريخ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{order.tenant.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{order.wilaya}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{order.items}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{order.total.toLocaleString()} دج</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{order.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                      <Eye className="w-4 h-4" />
                    </button>
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
