// app/lib/auth.ts

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'itb_session';
const USER_COOKIE = 'userId';

/* =========================
   READ
========================= */
export async function getSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE)?.value ?? null;
}

/* =========================
   WRITE
========================= */
export async function setSessionId(sessionId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 6,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

export async function setUserId(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(USER_COOKIE, userId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 6,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

/* =========================
   DELETE
========================= */
export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(USER_COOKIE);
}
