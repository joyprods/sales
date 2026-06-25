// app/(app)/layout.tsx

import { cookies } from 'next/headers';

import { redirect } from 'next/navigation';
import { getSessionId } from '@/lib/auth';
import LayoutWrapper from '@/components/LayoutWrapper';
import { VendorProvider } from '@/lib/vendor-context';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const vendorId = cookieStore.get('userId')?.value;

  const session = await getSessionId();

  if (!session || !vendorId) {
    cookieStore.delete('itb_session');
    cookieStore.delete('userId');
    redirect('/login');
  }

  // If your session contains vendor info:
  const vendorName = vendorId;

  return (
    <VendorProvider vendorName={vendorName}>
      <LayoutWrapper vendorName={vendorName}>
        {/* replace with real vendor if stored */}
        {children}
      </LayoutWrapper>
    </VendorProvider>
  );
}
