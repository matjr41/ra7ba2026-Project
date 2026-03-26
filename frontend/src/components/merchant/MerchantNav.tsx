'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Store,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'لوحة التحكم', href: '/merchant/dashboard', icon: LayoutDashboard },
  { name: 'المنتجات', href: '/merchant/products', icon: Package },
  { name: 'الطلبات', href: '/merchant/orders', icon: ShoppingCart },
  { name: 'العملاء', href: '/merchant/customers', icon: Users },
  { name: 'الإعدادات', href: '/merchant/settings', icon: Settings },
  { name: 'الاشتراك', href: '/merchant/subscription', icon: CreditCard },
  { name: 'التقارير', href: '/merchant/reports', icon: BarChart3 },
];

export default function MerchantNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-l border-gray-200">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gradient-to-l from-blue-600 to-blue-700">
            <Store className="h-8 w-8 text-white ml-3" />
            <span className="text-xl font-bold text-white">رحبة</span>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {user?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'التاجر'}</p>
                <p className="text-xs text-gray-500">{user?.tenant?.name || 'متجري'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`ml-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={() => logout()}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="ml-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center">
          <Store className="h-6 w-6 text-blue-600 ml-2" />
          <span className="text-lg font-bold text-gray-900">رحبة</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="px-4 py-6 bg-gradient-to-l from-blue-600 to-blue-700">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {user?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-white">{user?.name || 'التاجر'}</p>
                    <p className="text-xs text-blue-100">{user?.tenant?.name || 'متجري'}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`ml-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              
              {/* Logout */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="group flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut className="ml-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-red-500" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
