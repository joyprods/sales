// app/page.tsx
import { redirect } from 'next/navigation';
import { getSessionId, getUserId } from './lib/auth';

export default async function Home() {
  const sessionId = await getSessionId();
  const userId = await getUserId();

  if (sessionId && userId) {
    redirect('/dashboard');
  }

  redirect('/login');
}
