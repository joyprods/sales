// app/components/LayoutWrapper.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LayoutWrapper({
  children,
  vendorName
}: {
  children: React.ReactNode;
  vendorName: string;
}) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST'
      });

      router.replace('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/10'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-card border-b border-border shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold'>
              📦
            </div>
            <div>
              <h1 className='text-lg md:text-xl font-bold text-foreground'>
                {vendorName}
              </h1>
              <p className='text-xs text-foreground/70 font-medium'>
                Sales Portal
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className='btn-secondary text-sm'
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 md:py-12'>
        {children}
      </main>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className='modal-overlay'>
          <div className='modal max-w-sm space-y-4'>
            <div>
              <h2 className='heading-md mb-2'>Confirm Logout</h2>
              <p className='text-muted-foreground text-sm'>
                Are you sure you want to log out? You'll need to sign in again
                to access your account.
              </p>
            </div>

            <div className='flex gap-3 pt-4 border-t border-border'>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className='btn-secondary flex-1'
              >
                Cancel
              </button>
              <button onClick={handleLogout} className='btn-danger flex-1'>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
