// // app/components/vendor-form/SubmittingModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';

// export default function SubmittingModal({ show }: { show: boolean }) {
//   if (!show) return null;

//   const messages = [
//     'Validating details…',
//     'Adding products…',
//     'Storing data...',
//     'Finalizing…'
//   ];

//   const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
//     }, 2600); // slightly faster cycle

//     return () => clearInterval(interval);
//   }, [messages.length]);

//   return (
//     <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
//       <div className='bg-card rounded-xl p-5 max-w-xs w-full shadow-lg border border-border/50'>
//         <div className='flex flex-col items-center gap-4'>
//           <div className='relative'>
//             <div className='size-12 rounded-full bg-primary/15 flex items-center justify-center animate-pulse'>
//               <span className='text-2xl'>📦</span>
//             </div>
//             <div className='absolute inset-0 rounded-full bg-primary/25 animate-ping' />
//           </div>

//           <h3 className='text-base font-medium text-foreground'>Submitting…</h3>

//           <p className='text-xs text-muted-foreground text-center'>
//             {messages[currentMessageIndex]}
//           </p>

//           <div className='w-full h-1 bg-muted/60 rounded-full overflow-hidden mt-2 relative'>
//             <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer' />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';

type Status = 'loading' | 'success' | 'error';

export default function SubmittingModal({
  show,
  status,
  message,
  onClose
}: {
  show: boolean;
  status: Status;
  message?: string;
  onClose?: () => void;
}) {
  const messages = [
    'Validating details…',
    'Adding products…',
    'Storing data…',
    'Finalizing…'
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 🔄 Cycle loading messages
  useEffect(() => {
    if (status !== 'loading') return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [status]);

  // ✅ Auto close on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!show) return null;

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
      <div className='bg-card rounded-xl p-6 max-w-xs w-full shadow-xl border border-border/50 relative animate-in fade-in zoom-in-95 duration-200'>
        {/* ❌ Close button — ONLY success & error */}
        {status !== 'loading' && (
          <button
            onClick={onClose}
            className='absolute top-3 right-3 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition'
          >
            ✕
          </button>
        )}

        <div className='flex flex-col items-center gap-4'>
          {/* 🔄 LOADING STATE */}
          {status === 'loading' && (
            <>
              <div className='relative'>
                <div className='size-12 rounded-full bg-primary/15 flex items-center justify-center animate-pulse'>
                  <span className='text-2xl'>📦</span>
                </div>
                <div className='absolute inset-0 rounded-full bg-primary/25 animate-ping' />
              </div>

              <h3 className='text-base font-medium text-foreground'>
                Submitting…
              </h3>

              <p className='text-xs text-muted-foreground text-center'>
                {messages[currentMessageIndex]}
              </p>
            </>
          )}

          {/* ✅ SUCCESS STATE */}
          {status === 'success' && (
            <>
              <div className='size-12 rounded-full bg-emerald-500/15 flex items-center justify-center animate-in zoom-in-75 duration-300'>
                <svg
                  className='w-6 h-6 text-emerald-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>

              <h3 className='text-base font-semibold text-foreground'>
                Order Submitted
              </h3>

              <p className='text-xs text-muted-foreground text-center'>
                {message || 'Order was created successfully.'}
              </p>
            </>
          )}

          {/* ❌ ERROR STATE */}
          {status === 'error' && (
            <>
              <div className='size-12 rounded-full bg-destructive/15 flex items-center justify-center'>
                <span className='text-xl text-destructive'>✕</span>
              </div>

              <h3 className='text-base font-semibold text-foreground'>
                Submission Failed
              </h3>

              <p className='text-xs text-muted-foreground text-center'>
                {message || 'Something went wrong.'}
              </p>
            </>
          )}

          {/* shimmer only while loading */}
          {status === 'loading' && (
            <div className='w-full h-1 bg-muted/60 rounded-full overflow-hidden mt-2 relative'>
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
