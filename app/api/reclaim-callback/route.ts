import { NextRequest, NextResponse } from 'next/server';

// In-memory store for proofs (for demo; use a DB in production)
const proofs: Record<string, any> = {};

export async function POST(req: NextRequest) {
  console.log('Reclaim callback received');
  const body = await req.json();
  console.log('Callback body:', JSON.stringify(body, null, 2));
  
  // Extract sessionId from various possible locations
  let sessionId = body.sessionId || body.session_id || body.id;
  
  // If no sessionId in body, try to extract from URL parameters first
  if (!sessionId) {
    const url = new URL(req.url);
    sessionId = url.searchParams.get('sessionId');
    console.log('SessionId from URL params:', sessionId);
  }
  
  // If still no sessionId, try to extract from proof data or use a fallback
  if (!sessionId) {
    // Look for any identifier in the proof data
    if (body.claimData && body.claimData.context) {
      try {
        const context = JSON.parse(body.claimData.context);
        sessionId = context.sessionId || context.extractedParameterValues?.sessionId;
      } catch (e) {
        // Context is not JSON, use it as sessionId if it looks like one
        if (body.claimData.context.length > 10) {
          sessionId = body.claimData.context;
        }
      }
    }
  }
  
  // If we still don't have a sessionId, create one based on proof content
  if (!sessionId) {
    // Use a hash of the proof content as sessionId
    const proofString = JSON.stringify(body);
    sessionId = 'proof_' + Buffer.from(proofString).toString('base64').slice(0, 16);
    console.log('Generated sessionId from proof content:', sessionId);
  }
  
  console.log('Using sessionId:', sessionId);
  
  // Store the proof with the sessionId
  proofs[sessionId] = body;
  
  // Also store with a generic "latest" key as fallback
  proofs['latest'] = body;
  
  console.log('Proof stored for session:', sessionId);
  console.log('Current stored sessions:', Object.keys(proofs));
  
  return NextResponse.json({ status: 'ok', sessionId });
}

// For frontend polling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  console.log('GET request for sessionId:', sessionId);
  console.log('Available sessions:', Object.keys(proofs));
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId', 
      availableSessions: Object.keys(proofs) 
    }, { status: 400 });
  }
  
  let proof = proofs[sessionId];
  
  // If not found with exact sessionId, try some fallbacks
  if (!proof) {
    // Try to find a proof that might match
    for (const [key, value] of Object.entries(proofs)) {
      if (key.includes(sessionId) || sessionId.includes(key)) {
        proof = value;
        console.log('Found proof with partial match:', key);
        break;
      }
    }
  }
  
  // If still not found, try the latest proof as last resort
  if (!proof && proofs['latest']) {
    proof = proofs['latest'];
    console.log('Using latest proof as fallback');
  }
  
  if (!proof) {
    return NextResponse.json({ 
      found: false, 
      sessionId,
      availableSessions: Object.keys(proofs)
    });
  }
  
  return NextResponse.json({ found: true, proof, sessionId });
} 