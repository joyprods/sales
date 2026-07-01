// app/(public)/login/actions.ts
'use server';

import { setSessionId, setUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
type LoginResponse = { ok: true } | { ok: false; code: string };

export async function loginAction(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Local/Mock Bypass for testing during Form UI Phase
  if (!API_URL) {
    await setSessionId('mock_session_id_jinali_sales');
    await setUserId('sales1');
    redirect('/dashboard');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'login',
      portal: 'local',
      email,
      password
    }),
    cache: 'no-store'
  });

  const data = await res.json();
  console.log(data);

  if (!data?.ok) {
    return {
      ok: false,
      code: data?.code || 'UNKNOWN_ERROR'
    };
  }

  const sessionId = data?.session?.sessionId;

  if (!sessionId) {
    return {
      ok: false,
      code: data?.code || 'UNKNOWN_ERROR'
    };
  }

  // ✅ Cookie is now guaranteed to be committed
  await setSessionId(sessionId);

  // Also store user id in cookie
  await setUserId(data.user.id);

  // ✅ Server-side redirect (critical)
  redirect('/dashboard');
}

