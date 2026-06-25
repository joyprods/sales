// app/(public)/login/page.tsx
import { redirect } from 'next/navigation';
import { getSessionId, getUserId } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function Page() {
  const sessionId = await getSessionId();
  const userId = await getUserId();

  // ✅ Already logged in → never show login
  if (sessionId && userId) {
    redirect('/dashboard');
  }

  // ❌ Not logged in → show login
  return (
    <div className='flex items-center justify-center px-4'>
      <LoginForm />
    </div>
  );
}
