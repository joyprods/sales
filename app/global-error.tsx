'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring/debugging
    console.error('[v0] Global error:', error);
  }, [error]);

  return (
    <html lang='en'>
      <body className='bg-gradient-to-br from-background via-background to-secondary/20'>
        <div className='min-h-screen flex items-center justify-center px-4 py-12'>
          <div className='w-full max-w-md'>
            <div className='bg-card rounded-lg border border-border shadow-sm p-6 md:p-8 space-y-6'>
              {/* Error Icon */}
              <div className='flex justify-center'>
                <div className='flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10'>
                  <span className='text-4xl'>🔴</span>
                </div>
              </div>

              {/* Critical Error Content */}
              <div className='text-center space-y-3'>
                <h1 className='text-2xl md:text-3xl font-bold text-foreground'>
                  Critical Error
                </h1>
                <p className='text-muted text-sm md:text-base leading-relaxed'>
                  {error.message ||
                    'A critical error occurred. Our team has been notified.'}
                </p>
                {error.digest && (
                  <div className='bg-muted/40 border border-border rounded-lg p-3 mt-4'>
                    <p className='text-xs text-muted/80 font-mono break-all'>
                      Error ID: {error.digest}
                    </p>
                    <p className='text-xs text-muted/60 mt-2'>
                      Please share this ID if you contact support.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3 pt-4 border-t border-border'>
                <button
                  onClick={reset}
                  className='inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full'
                >
                  Reload Page
                </button>
                <a
                  href='/'
                  className='inline-flex items-center justify-center px-8 py-3 rounded-full border-2 border-primary text-primary font-medium transition-all duration-200 hover:bg-primary/5 active:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full'
                >
                  Back to Home
                </a>
              </div>

              {/* Support Message */}
              <div className='text-center text-xs text-muted/60'>
                <p>If the problem persists, please contact support.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
