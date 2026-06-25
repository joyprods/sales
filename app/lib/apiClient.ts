// app/lib/apiClient.ts
import { getSessionId } from './auth';

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL!;
export async function apiRequest(payload: any) {
  const sessionId = await getSessionId();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      sessionId,
      portal: 'local'
    }),
    cache: 'no-store'
  });

  const data = await res.json();

  if (data?.code === 'SESSION_EXPIRED' || data?.code === 'NO_SESSION') {
    throw new Error('UNAUTHENTICATED');
  }

  return data;
}
