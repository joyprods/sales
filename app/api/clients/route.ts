import { NextResponse } from 'next/server';
import { getSessionId } from '@/lib/auth';
import { fetchClientNames, addClient, fetchClientDetails, updateClientDetails } from '@/lib/api';

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  try {
    if (name) {
      const details = await fetchClientDetails(name);
      return NextResponse.json(details);
    } else {
      const data = await fetchClientNames();
      return NextResponse.json(data);
    }
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

    console.error('Client list/details error:', err);
    return NextResponse.json({ error: 'FAILED' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await addClient(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Client creation error:', err);
    return NextResponse.json({ error: err.message || 'FAILED' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { originalPartyName, data } = body;
    const result = await updateClientDetails(originalPartyName, data);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Client update error:', err);
    return NextResponse.json({ error: err.message || 'FAILED' }, { status: 500 });
  }
}
