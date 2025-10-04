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

  // Use override URL if provided, otherwise construct from request
  const callbackUrlOverride = process.env.RECLAIM_CALLBACK_URL_OVERRIDE;
  let callbackUrl: string;
  
  if (callbackUrlOverride) {
    callbackUrl = `${callbackUrlOverride}?sessionId=${sessionId}`;
    console.log('Using callback URL override with sessionId:', callbackUrl);
  } else {
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    callbackUrl = `${proto}://${host}/api/reclaim-callback?sessionId=${sessionId}`;
    console.log('Constructed callback URL with sessionId:', callbackUrl);
    console.log('Host:', host);
    console.log('Proto:', proto);
  }
  
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
    
    // Try multiple ways to set the callback URL
    if (typeof reclaimProofRequest.setAppCallbackUrl === 'function') {
      reclaimProofRequest.setAppCallbackUrl(callbackUrl);
      console.log('Set callback URL using setAppCallbackUrl');
    }
    
    // Also try setting it directly if the property exists
    if ('callbackUrl' in reclaimProofRequest) {
      (reclaimProofRequest as any).callbackUrl = callbackUrl;
      console.log('Set callback URL directly on property');
    }
    
    // Try setting it in the config if possible
    if (typeof (reclaimProofRequest as any).setRedirectUrl === 'function') {
      (reclaimProofRequest as any).setRedirectUrl(callbackUrl);
      console.log('Set callback URL using setRedirectUrl');
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