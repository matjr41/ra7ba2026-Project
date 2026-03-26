'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { merchantApi } from '@/lib/api';

interface Props {
  children: ReactNode;
}

export default function MerchantShell({ children }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [statsSnapshot, setStatsSnapshot] = useState<
    | {
        totalOrders?: number;
        totalProducts?: number;
        totalRevenue?: number;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    // تحميل الـ stats بشكل غير متزامن بعد تحميل الصفحة (تحسين الأداء)
    const loadStats = async () => {
      try {
        if (user?.role !== 'MERCHANT') return;
        // تأخير بسيط لعدم إبطاء تحميل الصفحة
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cancelled) return;
        
        const res = await merchantApi.getStats();
        const d: any = res?.data || {};
        const snapshot = {
          totalOrders: d.ordersCount ?? d.totalOrders ?? d.orders,
          totalProducts: d.productsCount ?? d.totalProducts ?? d.products,
          totalRevenue: d.totalSales ?? d.revenue,
        };
        if (!cancelled) setStatsSnapshot(snapshot);
      } catch (_) {
        // تجاهل الأخطاء - لا نريد إبطاء تحميل الصفحة
      }
    };
    // تحميل الـ stats بعد تحميل الصفحة مباشرة
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login?redirect=/merchant/dashboard');
      return;
    }

    if (user.role !== 'MERCHANT') {
      router.replace('/admin/dashboard');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'MERCHANT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pr-64">
      <DashboardSidebar />

      {/* Mobile Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <DashboardSidebar
            variant="mobile"
            onNavigate={() => setMobileNavOpen(false)}
            className="relative z-50"
          />
        </div>
      )}

      <div className="lg:pr-0 lg:ml-0 flex flex-col min-h-screen">
        <DashboardTopbar
          onMenuClick={() => setMobileNavOpen(true)}
          userName={user?.name}
          tenantName={user?.tenant?.name}
          statsSnapshot={statsSnapshot}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
