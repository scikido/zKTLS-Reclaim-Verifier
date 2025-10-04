import { NextRequest, NextResponse } from 'next/server';

// In-memory store for proofs (for demo; use a DB in production)
const proofs: Record<string, any> = {};

export async function POST(req: NextRequest) {
  console.log('Reclaim callback received');
  
  try {
    const { searchParams } = new URL(req.url);
    const rawbody = await req.text();
    const decoded = decodeURIComponent(rawbody);
    const body = JSON.parse(decoded);
    
    console.log('Callback body:', JSON.stringify(body, null, 2));
    
    // Get sessionId from body or URL parameters
    let sessionId = body.sessionId;
    
    if (!sessionId) {
      console.log('No sessionId in body, checking URL params');
      sessionId = searchParams.get('sessionId');
      
      if (!sessionId) {
        console.log('No sessionId found');
        return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
      }
    }
    
    console.log('Using sessionId:', sessionId);
    
    // Store the proof with both the body sessionId and URL sessionId
    if (body.sessionId) {
      proofs[body.sessionId] = body;
    }
    proofs[sessionId] = body;
    
    // Also store with a generic "latest" key as fallback
    proofs['latest'] = body;
    
    console.log('Proof stored for session:', sessionId);
    console.log('Current stored sessions:', Object.keys(proofs));
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ 
      error: 'Failed to process callback', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// For frontend polling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  console.log('GET request for sessionId:', sessionId);
  console.log('Available proofs:', proofs);
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId', 
      availableSessions: Object.keys(proofs) 
    }, { status: 400 });
  }
  
  const proof = proofs[sessionId];
  
  if (!proof) {
    return NextResponse.json({ found: false });
  }
  
  return NextResponse.json({ found: true, proof });
} 