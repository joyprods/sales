// app/components/vendor-form/ConfirmModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go Back',
  variant = 'success'
}: {
  show: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'success' | 'warning';
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!show || !mounted) return null;

  return createPortal(
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4'>
      <div className='bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border/50'>
        {/* Icon — centered */}
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-full mx-auto mb-4 ${
            variant === 'warning' ? 'bg-destructive/10' : 'bg-emerald-50'
          }`}
        >
          {variant === 'warning' ? (
            <svg
              className='w-5 h-5 text-destructive'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
              />
            </svg>
          ) : (
            <svg
              className='w-5 h-5 text-emerald-500'
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
          )}
        </div>

        <h3 className='font-semibold text-foreground text-center'>{title}</h3>
        <p className='text-sm text-muted-foreground mt-1 text-center'>
          {description}
        </p>

        {/* Buttons */}
        <div className='mt-6 flex flex-col gap-2'>
          {/* Primary action */}
          <button
            className={`w-full h-10 rounded-lg font-medium transition text-sm ${
              variant === 'warning'
                ? 'bg-destructive/75 hover:bg-destructive text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            onClick={onConfirm ?? onClose}
          >
            {confirmLabel}
          </button>

          {/* Cancel — green border to match primary theme */}
          {onConfirm && (
            <button
              className='w-full h-10 rounded-lg font-medium text-sm text-primary hover:bg-primary/5 transition border border-primary/40 hover:border-primary'
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
