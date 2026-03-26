'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'لوحة التحكم', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'المتاجر', href: '/admin/merchants', icon: Store },
  { name: 'المدفوعات', href: '/admin/payments', icon: CreditCard },
  { name: 'المنتجات', href: '/admin/products', icon: Package },
  { name: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
  { name: 'المستخدمين', href: '/admin/users', icon: Users },
  { name: 'التقارير', href: '/admin/reports', icon: BarChart3 },
  { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <Shield className="h-8 w-8 text-red-400 ml-3" />
            <div>
              <span className="text-xl font-bold">رحبة</span>
              <span className="block text-xs text-red-400">Super Admin</span>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-white">{user?.name || 'المشرف'}</p>
                <p className="text-xs text-gray-400">Super Administrator</p>
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
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`ml-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700">
            <button
              onClick={() => logout()}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut className="ml-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-white" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-gray-900 text-white">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-white hover:bg-gray-700"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-red-400 ml-2" />
          <span className="text-lg font-bold">رحبة Admin</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="px-4 py-6 bg-gray-900">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-white">{user?.name || 'المشرف'}</p>
                    <p className="text-xs text-red-400">Super Administrator</p>
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
                          ? 'bg-red-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`ml-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="group flex w-full items-center px-3 py-3 text-base font-medium text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                >
                  <LogOut className="ml-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" />
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
