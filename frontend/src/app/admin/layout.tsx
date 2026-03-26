import { Inter } from 'next/font/google';
import AdminShell from '@/components/admin/AdminShell';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-gray-50`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
