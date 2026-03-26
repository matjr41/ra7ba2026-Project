'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, Download, Calendar, FileText } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminReports() {
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [period, reportType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getReports({ period, reportType });
      setStats(data.stats);
      setTopMerchants(data.topMerchants || []);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h1>
          <p className="text-gray-600">تحليل شامل لأداء المنصة</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
          >
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذه السنة</option>
          </select>
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition">
            <Download className="w-5 h-5" />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10" />
            <span className={`flex items-center gap-1 text-sm font-bold ${
              stats.revenueChange >= 0 ? 'bg-white/20' : 'bg-red-500/20'
            } px-2 py-1 rounded-full`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.revenueChange)}%
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">إجمالي الإيرادات</p>
          <h3 className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} دج</h3>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-10 h-10" />
            <span className={`flex items-center gap-1 text-sm font-bold ${
              stats.ordersChange >= 0 ? 'bg-white/20' : 'bg-red-500/20'
            } px-2 py-1 rounded-full`}>
              {stats.ordersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.ordersChange)}%
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">إجمالي الطلبات</p>
          <h3 className="text-3xl font-bold">{stats.totalOrders}</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-10 h-10" />
            <span className={`flex items-center gap-1 text-sm font-bold ${
              stats.productsChange >= 0 ? 'bg-white/20' : 'bg-red-500/20'
            } px-2 py-1 rounded-full`}>
              {stats.productsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.productsChange)}%
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">إجمالي المنتجات</p>
          <h3 className="text-3xl font-bold">{stats.totalProducts}</h3>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10" />
            <span className={`flex items-center gap-1 text-sm font-bold ${
              stats.usersChange >= 0 ? 'bg-white/20' : 'bg-red-500/20'
            } px-2 py-1 rounded-full`}>
              {stats.usersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.usersChange)}%
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">المستخدمين</p>
          <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex gap-2 mb-6">
          {['overview', 'merchants', 'products', 'sales'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                reportType === type
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'overview' && 'نظرة عامة'}
              {type === 'merchants' && 'التجار'}
              {type === 'products' && 'المنتجات'}
              {type === 'sales' && 'المبيعات'}
            </button>
          ))}
        </div>

        {reportType === 'merchants' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">أفضل التجار أداءً</h3>
            <div className="space-y-4">
              {topMerchants.map((merchant, index) => (
                <div key={merchant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{merchant.name}</p>
                      <p className="text-sm text-gray-600">{merchant.orders} طلب</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">{merchant.revenue.toLocaleString()} دج</p>
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${
                      merchant.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {merchant.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(merchant.growth)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'products' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">أكثر المنتجات مبيعاً</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} مبيعة</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">{product.revenue.toLocaleString()} دج</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            الإيرادات الشهرية
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-500">مخطط الإيرادات</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            نمو الطلبات
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-500">مخطط الطلبات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
