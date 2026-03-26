'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Filter, Mail, Phone, MapPin, ShoppingBag, Eye, Calendar, DollarSign, User } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  wilaya?: string;
  commune?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
};

type SortField = 'name' | 'totalSpent' | 'ordersCount' | 'lastOrderDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function MerchantCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    totalSpent: 0,
    averageOrderValue: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, statusFilter, sortField, sortDirection]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // TODO: Add API call when backend endpoint is ready
      // const response = await merchantApi.getCustomers();
      // setCustomers(response.data?.data || []);

      // For now, use mock data
      setCustomers([
        {
          id: '1',
          name: 'أحمد محمد علي',
          email: 'ahmed@example.com',
          phone: '+213 555 000 001',
          address: 'حي الزهور، الجزائر العاصمة',
          wilaya: 'الجزائر',
          commune: 'بئر مراد رايس',
          ordersCount: 5,
          totalSpent: 25000,
          lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACTIVE',
        },
        {
          id: '2',
          name: 'فاطمة الزهراء بنت سعيد',
          email: 'fatima@example.com',
          phone: '+213 555 000 002',
          address: 'حي الرياض، وهران',
          wilaya: 'وهران',
          commune: 'السانيا',
          ordersCount: 3,
          totalSpent: 15000,
          lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACTIVE',
        },
        {
          id: '3',
          name: 'محمد بن علي',
          email: 'mohamed@example.com',
          phone: '+213 555 000 003',
          address: 'حي الواحات، قسنطينة',
          wilaya: 'قسنطينة',
          commune: 'قسنطينة',
          ordersCount: 2,
          totalSpent: 8500,
          lastOrderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'INACTIVE',
        },
      ]);

      // Calculate stats
      const total = 3;
      const active = 2;
      const newThisMonth = 1;
      const totalSpent = 48500;
      const averageOrderValue = Math.round(totalSpent / 10); // 10 total orders

      setStats({ total, active, newThisMonth, totalSpent, averageOrderValue });
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = customers.filter((customer) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!customer.name?.toLowerCase().includes(searchLower) &&
            !customer.email?.toLowerCase().includes(searchLower) &&
            !customer.phone?.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && customer.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'ordersCount':
          aValue = a.ordersCount;
          bValue = b.ordersCount;
          break;
        case 'lastOrderDate':
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'نشط' : 'غير نشط';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            العملاء
          </h1>
          <p className="text-gray-600 mt-1">إدارة قاعدة بيانات عملائك</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCustomers()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">عملاء نشطون</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <User className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع العملاء</option>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalSpent')}>
                  <div className="flex items-center gap-1">
                    إجمالي الإنفاق
                    {sortField === 'totalSpent' && (
                      <span className={`text-xs ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>↓</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ordersCount')}>
                  <div className="flex items-center gap-1">
                    عدد الطلبات
                    {sortField === 'ordersCount' && (
                      <span className={`text-xs ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>↓</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastOrderDate')}>
                  <div className="flex items-center gap-1">
                    آخر طلب
                    {sortField === 'lastOrderDate' && (
                      <span className={`text-xs ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>↓</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'لا توجد عملاء مطابقين للفلاتر المحددة'
                      : 'لا توجد عملاء بعد'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        customer.ordersCount > 5
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : customer.ordersCount > 2
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {customer.ordersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'لم يطلب بعد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(customer.status)}`}>
                        {getStatusLabel(customer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {selectedCustomer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    <p className="text-sm text-gray-600">عميل منذ {formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    معلومات الاتصال
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedCustomer.email || 'غير محدد'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedCustomer.phone || 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    العنوان
                  </h3>
                  <div className="space-y-2">
                    <p>{selectedCustomer.address || 'غير محدد'}</p>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.wilaya && selectedCustomer.commune
                        ? `${selectedCustomer.wilaya} - ${selectedCustomer.commune}`
                        : 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">إحصائيات العميل</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">عدد الطلبات</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedCustomer.ordersCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">آخر طلب</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'لم يطلب بعد'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">الطلبات الأخيرة</h3>
                <div className="space-y-3">
                  {/* Mock recent orders - replace with real data when API is ready */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">طلب #12345</p>
                      <p className="text-sm text-gray-600">2 منتج - تم التوصيل</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(2500)}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">طلب #12344</p>
                      <p className="text-sm text-gray-600">1 منتج - قيد المعالجة</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(1500)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
