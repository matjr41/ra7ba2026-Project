'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from './AdminNav';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login?redirect=/admin/dashboard');
      return;
    }

    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/merchant/dashboard');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="lg:pr-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
