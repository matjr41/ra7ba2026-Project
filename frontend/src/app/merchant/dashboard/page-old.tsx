'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { merchantApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Package, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  Settings,
  ExternalLink,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bell,
  Star,
  Eye,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendText?: string;
  colorClass?: string;
};

// مكون البطاقة الإحصائية بألوان متغيرة
const StatCard = ({ title, value, icon: Icon, trend, trendText, colorClass = 'from-blue-400 to-blue-600' }: StatCardProps) => (
  <div className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl border border-gray-100 transition-all duration-500 overflow-hidden">
    {/* خلفية متحركة بألوان خافتة */}
    <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent opacity-5 rounded-full transform translate-x-8 -translate-y-8"></div>
    
    <div className="relative z-10 flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">{value}</h3>
        {trend !== undefined && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              trend > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 
              trend < 0 ? 'bg-red-50 text-red-700 border border-red-200' : 
              'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : trend < 0 ? <TrendingDown className="w-3 h-3 ml-1" /> : '='}
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-gray-500">{trendText}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

type QuickActionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  colorClass?: string;
};

// مكون الإجراءات السريعة
const QuickAction = ({ icon: Icon, title, description, href = '#', colorClass = 'from-blue-500 to-blue-600' }: QuickActionProps) => (
  <Link href={href} className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden block">
    {/* تأثير الخلفية المتحركة */}
    <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg group-hover:bg-white group-hover:text-blue-600 transition-all duration-300`}>
          <Icon className="w-7 h-7" />
        </div>
        <ArrowUpRight className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
      </div>
      <h4 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-white transition-colors duration-300">{title}</h4>
      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-white/90 transition-colors duration-300">{description}</p>
    </div>
  </Link>
);

export default function MerchantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!authLoading && user) {
      // تحميل الـ dashboard فوراً بدون تأخير
      loadDashboard();
    } else if (!authLoading && !user) {
      // إذا لم يكن هناك مستخدم، لا نعرض loading
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      // تحميل سريع - لا ننتظر إذا كان هناك بيانات محفوظة
      const { data } = await merchantApi.getDashboard();
      setDashboard(data);
      setLoading(false); // إيقاف loading فوراً بعد الحصول على البيانات
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const tenant = dashboard?.tenant || {};
  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recentOrders || [];
  const topProducts = stats?.topProducts || [];
  const isTrial = tenant?.status === 'TRIAL';
  const isActive = tenant?.status === 'ACTIVE';
  const isExpired = tenant?.status === 'EXPIRED' || tenant?.status === 'SUSPENDED';

  // ألوان متغيرة تلقائياً حسب الوقت
  const getTimeBasedColor = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) return 'from-orange-400 to-yellow-500'; // صباح
    if (hour >= 12 && hour < 17) return 'from-blue-400 to-cyan-500'; // ظهر
    if (hour >= 17 && hour < 20) return 'from-purple-400 to-pink-500'; // مساء
    return 'from-indigo-500 to-purple-600'; // ليل
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header الترحيبي */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  مرحباً، {user?.name || 'التاجر'}! 👋
                </h1>
              </div>
              <p className="text-gray-600 text-lg">إليك ملخص نشاط متجرك اليوم</p>
              <p className="text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadDashboard}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              
              <a
                href={tenant?.subdomain ? `/store/${tenant.subdomain}` : (user?.tenant?.subdomain ? `/store/${user.tenant.subdomain}` : '#')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const subdomain = tenant?.subdomain || user?.tenant?.subdomain;
                  if (!subdomain) {
                    e.preventDefault();
                    alert('لم يتم العثور على معرف المتجر. يرجى التواصل مع الدعم.');
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Eye className="w-5 h-5" />
                عرض متجري 🛍️
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* تنبيهات الاشتراك */}
        {isTrial && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500 rounded-2xl p-5 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-1">فترة تجريبية نشطة</h3>
                <p className="text-blue-700 mb-3">
                  لديك {dashboard?.trialDaysLeft || 0} يوم متبقي. قم بترقية اشتراكك الآن للاستمرار.
                </p>
                <Link href="/merchant/subscription" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                  <Zap className="w-4 h-4" />
                  ترقية الآن
                </Link>
              </div>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-r-4 border-red-500 rounded-2xl p-5 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500 rounded-xl text-white">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">اشتراك منتهي</h3>
                <p className="text-red-700 mb-3">
                  انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لاستعادة الوصول الكامل.
                </p>
                <Link href="/merchant/subscription" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                  تجديد الاشتراك
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* البطاقات الإحصائية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="إجمالي المبيعات"
            value={formatCurrency(stats.totalSales || 0)}
            icon={ShoppingBag}
            trend={stats.salesGrowthPercentage ?? 0}
            trendText="عن الشهر الماضي"
            colorClass="from-green-400 to-emerald-600"
          />
          <StatCard
            title="الطلبات الجديدة"
            value={stats.newOrders ?? 0}
            icon={Package}
            trend={stats.ordersGrowthPercentage ?? 0}
            trendText="عن الأسبوع الماضي"
            colorClass="from-blue-400 to-indigo-600"
          />
          <StatCard
            title="عدد العملاء"
            value={stats.customersCount ?? 0}
            icon={Users}
            trend={stats.customersGrowthPercentage ?? 0}
            trendText="تغير شهري"
            colorClass="from-purple-400 to-pink-600"
          />
          <StatCard
            title="إيرادات الشهر"
            value={formatCurrency(stats.subscriptionRevenue || 0)}
            icon={CreditCard}
            trend={stats.subscriptionGrowthPercentage ?? 0}
            trendText="عن الشهر السابق"
            colorClass="from-orange-400 to-red-600"
          />
        </div>

        {/* إجراءات سريعة */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              icon={Plus}
              title="إضافة منتج"
              description="أضف منتجاً جديداً إلى متجرك بسهولة"
              href="/merchant/products"
              colorClass="from-blue-500 to-cyan-600"
            />
            <QuickAction
              icon={BarChart2}
              title="التقارير"
              description="تابع أداء مبيعاتك وتحليلات متجرك"
              href="/merchant/reports"
              colorClass="from-purple-500 to-pink-600"
            />
            <QuickAction
              icon={Settings}
              title="الإعدادات"
              description="تخصيص متجرك وإعدادات الشحن والدفع"
              href="/merchant/settings"
              colorClass="from-orange-500 to-red-600"
            />
          </div>
        </div>

        {/* أحدث الطلبات */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">أحدث الطلبات</h2>
              <p className="text-sm text-gray-500 mt-1">تتبع طلبات عملائك الأخيرة</p>
            </div>
            <Link
              href="/merchant/orders"
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
            >
              عرض الكل
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد طلبات حديثة حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">رقم الطلب</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">العميل</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-900">#{order.orderNumber}</td>
                      <td className="px-4 py-4 text-gray-700">{order.customerName || 'عميل'}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{formatCurrency(order.totalAmount || 0)}</td>
                      <td className="px-4 py-4 text-gray-500 text-sm">{order.createdAt ? formatDate(order.createdAt) : '-'}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : order.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : order.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {order.status || 'غير محدد'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* أفضل المنتجات */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">أفضل المنتجات</h2>
              <p className="text-sm text-gray-500 mt-1">المنتجات الأكثر مبيعاً</p>
            </div>
            <Link
              href="/merchant/products"
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
            >
              إدارة المنتجات
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لم يتم تسجيل منتجات مميزة بعد</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topProducts.map((product: any, index: number) => (
                <div key={product.id} className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                        {index === 0 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{product.name}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(product.totalSales || 0)} مبيعات</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                      (product.change ?? 0) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {(product.change ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(product.change ?? 0)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>المخزون: {product.stock ?? 0}</span>
                    <span>الطلبات: {product.ordersCount ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
