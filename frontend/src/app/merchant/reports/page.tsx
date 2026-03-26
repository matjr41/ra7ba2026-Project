'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Eye,
  Activity,
  RefreshCw,
  Filter,
} from 'lucide-react';

type AnalyticsData = {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueGrowth: number;
    ordersGrowth: number;
    customersGrowth: number;
    productsGrowth: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  customersByLocation: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
    customers: number;
  }>;
};

export default function MerchantReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await merchantApi.getAnalytics(dateRange);
      // setData(response.data);

      // Mock data for demonstration
      setData({
        overview: {
          totalRevenue: 485000,
          totalOrders: 1247,
          totalCustomers: 324,
          totalProducts: 89,
          revenueGrowth: 12.5,
          ordersGrowth: 8.2,
          customersGrowth: 15.7,
          productsGrowth: 5.1,
        },
        revenueByMonth: [
          { month: 'يناير', revenue: 45000, orders: 120 },
          { month: 'فبراير', revenue: 52000, orders: 135 },
          { month: 'مارس', revenue: 48000, orders: 118 },
          { month: 'أبريل', revenue: 61000, orders: 142 },
          { month: 'مايو', revenue: 67000, orders: 158 },
          { month: 'يونيو', revenue: 58000, orders: 145 },
        ],
        topProducts: [
          { id: '1', name: 'هاتف سامسونج A54', sales: 45, revenue: 135000, growth: 12.5 },
          { id: '2', name: 'لاب توب ديل', sales: 32, revenue: 128000, growth: 8.3 },
          { id: '3', name: 'سماعات بلوتوث', sales: 28, revenue: 56000, growth: 15.2 },
          { id: '4', name: 'شاحن سريع', sales: 25, revenue: 25000, growth: -2.1 },
          { id: '5', name: 'كفر هاتف', sales: 22, revenue: 11000, growth: 5.8 },
        ],
        ordersByStatus: [
          { status: 'تم التوصيل', count: 892, percentage: 71.5 },
          { status: 'قيد المعالجة', count: 234, percentage: 18.8 },
          { status: 'قيد الانتظار', count: 89, percentage: 7.1 },
          { status: 'ملغي', count: 32, percentage: 2.6 },
        ],
        customersByLocation: [
          { location: 'الجزائر العاصمة', count: 145, percentage: 44.8 },
          { location: 'وهران', count: 78, percentage: 24.1 },
          { location: 'قسنطينة', count: 45, percentage: 13.9 },
          { location: 'عنابة', count: 32, percentage: 9.9 },
          { location: 'أخرى', count: 24, percentage: 7.4 },
        ],
        dailyStats: [
          { date: '2024-01-01', orders: 45, revenue: 18500, customers: 38 },
          { date: '2024-01-02', orders: 52, revenue: 22100, customers: 45 },
          { date: '2024-01-03', orders: 38, revenue: 15600, customers: 32 },
          { date: '2024-01-04', orders: 61, revenue: 25800, customers: 54 },
          { date: '2024-01-05', orders: 49, revenue: 20100, customers: 42 },
        ],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    alert(`تصدير التقرير بصيغة ${format.toUpperCase()}`);
    // TODO: Implement actual export
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد بيانات متاحة</p>
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
            <BarChart3 className="w-6 h-6 text-blue-600" />
            التقارير والتحليلات
          </h1>
          <p className="text-gray-600 mt-1">تابع أداء متجرك بشكل تفصيلي</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
            <option value="1y">آخر سنة</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">
                {data.overview.totalRevenue.toLocaleString()} دج
              </p>
              <div className={`flex items-center gap-1 text-xs ${data.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.overview.revenueGrowth)}%
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-blue-600">{data.overview.totalOrders}</p>
              <div className={`flex items-center gap-1 text-xs ${data.overview.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.ordersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.overview.ordersGrowth)}%
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-purple-600">{data.overview.totalCustomers}</p>
              <div className={`flex items-center gap-1 text-xs ${data.overview.customersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.customersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.overview.customersGrowth)}%
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المنتجات المباعة</p>
              <p className="text-2xl font-bold text-orange-600">{data.overview.totalProducts}</p>
              <div className={`flex items-center gap-1 text-xs ${data.overview.productsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.productsGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.overview.productsGrowth)}%
              </div>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            الإيرادات الشهرية
          </h3>
          <div className="space-y-3">
            {data.revenueByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-2 bg-blue-200 rounded-full">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(item.revenue / Math.max(...data.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{item.month}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.revenue.toLocaleString()} دج</p>
                  <p className="text-xs text-gray-500">{item.orders} طلب</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            الطلبات حسب الحالة
          </h3>
          <div className="space-y-3">
            {data.ordersByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'تم التوصيل' ? 'bg-green-500' :
                    item.status === 'قيد المعالجة' ? 'bg-blue-500' :
                    item.status === 'قيد الانتظار' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">{item.status}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.count}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          أفضل المنتجات مبيعاً
        </h3>
        <div className="space-y-3">
          {data.topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} مبيعات</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{product.revenue.toLocaleString()} دج</p>
                <div className={`flex items-center gap-1 text-xs ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(product.growth)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customers by Location */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          العملاء حسب الموقع الجغرافي
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.customersByLocation.map((location, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                  {index + 1}
                </div>
                <span className="font-medium">{location.location}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{location.count}</p>
                <p className="text-xs text-gray-500">{location.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Stats Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          إحصائيات يومية
        </h3>
        <div className="space-y-4">
          {data.dailyStats.map((day, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-semibold">{new Date(day.date).toLocaleDateString('ar-DZ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الطلبات</p>
                <p className="font-semibold text-blue-600">{day.orders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الإيرادات</p>
                <p className="font-semibold text-green-600">{day.revenue.toLocaleString()} دج</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">العملاء الجدد</p>
                <p className="font-semibold text-purple-600">{day.customers}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
