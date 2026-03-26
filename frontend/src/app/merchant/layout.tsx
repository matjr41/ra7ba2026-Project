'use client';
import { Toaster } from 'sonner';
import MerchantShell from '@/components/merchant/MerchantShell';

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MerchantShell>{children}</MerchantShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
