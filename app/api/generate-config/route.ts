export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { getProviderById } from '@/lib/providers';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const sessionId = uuidv4();
  const providerId = searchParams.get('providerId') || 'gmail';

  const provider = getProviderById(providerId);
  if (!provider) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  // Use override URL if provided, otherwise construct from request origin
  const callbackUrlOverride = process.env.RECLAIM_CALLBACK_URL_OVERRIDE;
  let callbackUrl: string;
  
  if (callbackUrlOverride) {
    callbackUrl = `${callbackUrlOverride}?sessionId=${sessionId}`;
    console.log('Using callback URL override with sessionId:', callbackUrl);
  } else {
    callbackUrl = `${origin}/api/reclaim-callback?sessionId=${sessionId}`;
    console.log('Constructed callback URL with sessionId:', callbackUrl);
    console.log('Origin:', origin);
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
    
    const config = reclaimProofRequest.toJsonString();
    return NextResponse.json({ 
      reclaimProofRequestConfig: config,
      sessionId,
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