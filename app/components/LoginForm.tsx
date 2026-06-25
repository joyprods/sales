// app/components/LoginForm.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import Footer from '@/components/Footer';
import { validateLogin } from '@/lib/validation';
import { loginAction } from '@/(public)/login/actions';
import { Eye, EyeOff } from 'lucide-react';
export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (showErrorModal || showForgotModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showErrorModal, showForgotModal]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateLogin(email, password);

    if (validationError) {
      setError(validationError);
      setShowErrorModal(true);
      return;
    }

    startTransition(async () => {
      const res = await loginAction(email, password);

      if (!res?.ok) {
        let message = 'Unable to sign in. Please try again.';

        switch (res.code) {
          case 'INVALID_CREDENTIALS':
            message = 'Incorrect email or password.';
            break;

          case 'USER_NOT_FOUND':
            message = 'No account found with this email.';
            break;

          case 'ACCOUNT_DISABLED':
            message = 'Your account has been disabled.';
            break;

          case 'SESSION_NOT_CREATED':
            message = 'Session could not be created.';
            break;
        }

        setError(message);
        setShowErrorModal(true);
        return;
      }

      router.replace('/dashboard');
    });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setResetMessage(
      'If an account exists with this email, you will receive a password reset link.'
    );
    setIsLoading(false);
  };

  return (
    <>
      <div className='w-full max-w-md'>
        <div className='mb-2 sm:mb-8 text-center'>
          <h1 className='heading-lg mb-2 text-center'>Joymex Foods Portal</h1>
          <p className='text-center text-muted-foreground text-sm'>
            Sign in to your account to manage your sales
          </p>
        </div>

        <form onSubmit={onSubmit} className='card space-y-6'>
          <div className='form-group'>
            <label className='label'>Email Address</label>
            <input
              type='email'
              className='input'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              autoComplete='email'
            />
          </div>

          <div className='form-group'>
            <div className='flex justify-between items-center'>
              <label className='label'>Password</label>
              <button
                type='button'
                onClick={() => setShowForgotModal(true)}
                className='text-xs text-primary hover:underline font-medium bg-transparent border-none cursor-pointer'
              >
                Forgot password?
              </button>
            </div>

            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                className='input pr-10'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                autoComplete='current-password'
              />

              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition'
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <button
            type='submit'
            className='btn-primary w-full'
            disabled={isPending}
          >
            {isPending ? (
              <span className='flex items-center gap-2'>
                <span className='h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <Footer />
        </form>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4'>
          <div className='bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border/50'>
            <div className='flex items-start gap-3'>
              <div className='shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-xl'>
                ⚠️
              </div>
              <div className='space-y-1'>
                <h3 className='font-semibold text-destructive'>
                  {error === 'Incorrect email or password.'
                    ? 'Invalid Credentials'
                    : 'Validation Error'}
                </h3>
                <p className='text-sm text-muted-foreground'>{error}</p>
              </div>
            </div>
            <button
              className='mt-6 w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition'
              onClick={() => {
                setShowErrorModal(false);
                setPassword('');
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4'>
          <div className='bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border/50'>
            <h3 className='text-lg font-semibold mb-4'>Reset Your Password</h3>

            {resetMessage ? (
              <div className='text-center space-y-4'>
                <p className='text-sm text-muted-foreground'>{resetMessage}</p>
                <button
                  className='w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition'
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetMessage('');
                    setResetEmail('');
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className='space-y-5'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium'>Email Address</label>
                  <input
                    type='email'
                    className='w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none'
                    placeholder='you@example.com'
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className='text-xs text-muted-foreground'>
                    We'll send a password reset link if this email is
                    registered.
                  </p>
                </div>

                <div className='flex gap-3'>
                  <button
                    type='button'
                    className='flex-1 h-10 border border-input rounded-lg font-medium hover:bg-muted transition'
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetEmail('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2'
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className='h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
