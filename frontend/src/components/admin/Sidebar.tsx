'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Store,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  FileText,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'الرئيسية', href: '/admin/dashboard', icon: Home },
  { name: 'التجار', href: '/admin/merchants', icon: Store },
  { name: 'المنتجات', href: '/admin/products', icon: Package },
  { name: 'الطلبات', href: '/admin/orders', icon: ShoppingBag },
  { name: 'العملاء', href: '/admin/customers', icon: Users },
  { name: 'الاشتراكات', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'الفواتير', href: '/admin/invoices', icon: FileText },
  { name: 'الخصومات', href: '/admin/discounts', icon: Ticket },
  { name: 'التقارير', href: '/admin/reports', icon: BarChart3 },
  { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-blue-600">إدارة المنصة</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  المشرف
                </p>
                <button className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center">
                  <span>تسجيل خروج</span>
                  <LogOut className="mr-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
