// app/api/client-categories/route.ts
import { NextResponse } from 'next/server';
import { getSessionId } from '@/lib/auth';
import { fetchClientCategories } from '@/lib/api';

export async function GET() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    const response = NextResponse.json(
      { error: 'UNAUTHENTICATED' },
      { status: 401 }
    );
    response.cookies.delete('itb_session');
    response.cookies.delete('itb_user');
    return response;
  }

  try {
    const data = await fetchClientCategories();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      const response = NextResponse.json(
        { error: 'UNAUTHENTICATED' },
        { status: 401 }
      );
      response.cookies.delete('itb_session');
      response.cookies.delete('itb_user');
      return response;
    }

    console.error('Fetch client categories error:', err);
    return NextResponse.json({ error: 'FAILED' }, { status: 500 });
  }
}
