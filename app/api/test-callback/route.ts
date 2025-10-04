import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const callbackUrl = `${proto}://${host}/api/reclaim-callback`;
  
  return NextResponse.json({
    message: 'Callback test endpoint',
    constructedCallbackUrl: callbackUrl,
    overrideUrl: process.env.RECLAIM_CALLBACK_URL_OVERRIDE || 'Not set',
    host,
    proto,
    headers: Object.fromEntries(req.headers.entries())
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  return NextResponse.json({
    message: 'Test callback received',
    body,
    timestamp: new Date().toISOString()
  });
}