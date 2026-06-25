'use client';

import { createContext, useContext } from 'react';

const VendorContext = createContext<string | null>(null);

export function VendorProvider({
  vendorName,
  children
}: {
  vendorName: string;
  children: React.ReactNode;
}) {
  return (
    <VendorContext.Provider value={vendorName}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used inside VendorProvider');
  return ctx;
}
