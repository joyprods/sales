// app/api/prices/route.ts
import { NextResponse } from 'next/server';
import { getSessionId } from '@/lib/auth';
import { fetchActiveClientsGrouped, fetchProductPrices, saveProductPrices, fetchAllProductPrices } from '@/lib/api';

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
  const action = searchParams.get('action');

  try {
    if (action === 'getClients') {
      const data = await fetchActiveClientsGrouped();
      return NextResponse.json(data);
    } else if (action === 'getAllPrices') {
      const clientType = searchParams.get('clientType');

      if (!clientType) {
        return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
      }

      const data = await fetchAllProductPrices(clientType);
      return NextResponse.json(data);
    } else if (action === 'getPrices') {
      const clientName = searchParams.get('clientName');
      const clientType = searchParams.get('clientType');

      if (!clientName || !clientType) {
        return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
      }

      const data = await fetchProductPrices(clientType, clientName);
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
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

    console.error('Prices API GET error:', err);
    return NextResponse.json({ error: err.message || 'FAILED' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { clientType, clientName, prices } = body;

    if (!clientType || !clientName || !prices) {
      return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
    }

    const result = await saveProductPrices(clientType, clientName, prices);
    return NextResponse.json(result);
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

    console.error('Prices API POST error:', err);
    return NextResponse.json({ error: err.message || 'FAILED' }, { status: 500 });
  }
}
