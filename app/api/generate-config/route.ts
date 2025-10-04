export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { getProviderById } from '@/lib/providers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const providerId = searchParams.get('providerId') || 'gmail';
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const provider = getProviderById(providerId);
  if (!provider) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const callbackUrl = `${proto}://${host}/api/reclaim-callback`;
  const appId = process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
  const appSecret = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET;
  
  if (!appId || !appSecret) {
    console.error('Reclaim credentials missing in environment', { appId, appSecret });
    return NextResponse.json({ error: 'Reclaim credentials missing in environment' }, { status: 500 });
  }
  
  try {
    const reclaimProofRequest = await ReclaimProofRequest.init(
      appId,
      appSecret,
      provider.providerId
    );
    
    if (typeof reclaimProofRequest.setAppCallbackUrl === 'function') {
      reclaimProofRequest.setAppCallbackUrl(callbackUrl);
    }
    
    const config = await reclaimProofRequest.toJsonString();
    return NextResponse.json({ 
      reclaimProofRequestConfig: config,
      provider: provider.name 
    });
  } catch (err: any) {
    console.error('ReclaimProofRequest.init error:', err);
    if (err instanceof Error) {
      console.error('Stack:', err.stack);
      return NextResponse.json({ 
        error: 'Failed to initialize Reclaim proof request', 
        details: err.message, 
        stack: err.stack 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to initialize Reclaim proof request', 
        details: String(err) 
      }, { status: 500 });
    }
  }
} 