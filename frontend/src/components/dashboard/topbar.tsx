'use client';

import { useMemo } from 'react';
import { Menu, Plus, Bell, Search, Sparkles, LogOut } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardTopbarProps {
  onMenuClick: () => void;
  userName?: string;
  tenantName?: string;
  statsSnapshot?: {
    totalOrders?: number;
    totalProducts?: number;
    totalRevenue?: number;
  };
}

export function DashboardTopbar({ onMenuClick, userName, tenantName, statsSnapshot }: DashboardTopbarProps) {
  const { logout } = useAuth();
  const summaryBadge = useMemo(() => {
    if (!statsSnapshot) return null;
    const items = [] as string[];
    if (statsSnapshot.totalOrders !== undefined) {
      items.push(`${statsSnapshot.totalOrders} طلب`);
    }
    if (statsSnapshot.totalProducts !== undefined) {
      items.push(`${statsSnapshot.totalProducts} منتج`);
    }
    if (statsSnapshot.totalRevenue !== undefined) {
      items.push(`${Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD' }).format(statsSnapshot.totalRevenue)} مبيعات`);
    }
    return items.join(' • ');
  }, [statsSnapshot]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 border-b border-gray-200 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex items-center gap-4 px-4 py-4 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 px-4 py-2 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="ابحث عن منتجات، طلبات أو عملاء..."
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {summaryBadge && (
            <div className="hidden md:inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200">
              <Sparkles className="w-4 h-4" />
              {summaryBadge}
            </div>
          )}
          <Button variant="secondary" size="icon" className="rounded-xl" aria-label="الإشعارات">
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            aria-label="تسجيل الخروج"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
          <Button className="hidden sm:inline-flex rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{userName || 'التاجر'}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">{tenantName || 'متجري'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
