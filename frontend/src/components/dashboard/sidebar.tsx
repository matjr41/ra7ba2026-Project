'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Truck,
  Plug,
  Globe,
} from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export const dashboardNavItems = [
  { href: '/merchant/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/merchant/products', label: 'المنتجات', icon: Package },
  { href: '/merchant/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/merchant/shipping', label: 'الشحن', icon: Truck },
  { href: '/merchant/integrations', label: 'التطبيقات', icon: Plug },
  { href: '/merchant/domain', label: 'الدومين', icon: Globe },
  { href: '/merchant/customers', label: 'العملاء', icon: Users },
  { href: '/merchant/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/merchant/settings', label: 'الإعدادات', icon: Settings },
  { href: '/merchant/subscription', label: 'الاشتراك', icon: CreditCard },
];

interface DashboardSidebarProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebar({ variant = 'desktop', onNavigate, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    if (!pathname) return '/merchant/dashboard';
    const match = dashboardNavItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return match?.href ?? '/merchant/dashboard';
  }, [pathname]);

  const baseClasses =
    variant === 'mobile'
      ? 'flex flex-col w-64 h-full bg-white border-l border-gray-200 dark:bg-slate-900 dark:border-slate-800'
      : 'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:right-0 bg-white border-l border-gray-200 dark:bg-slate-900 dark:border-slate-800';

  return (
    <aside className={cn(baseClasses, className)}>
      <div className="flex-1 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-800">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
              لوحة التاجر
            </span>
            <span className="text-2xl font-bold text-primary">Rahba</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {dashboardNavItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border border-transparent',
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                )}
                onClick={onNavigate}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} رحبة
      </div>
    </aside>
  );
}
