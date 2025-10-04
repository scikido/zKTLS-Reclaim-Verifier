import { NextRequest, NextResponse } from 'next/server';

// In-memory store for proofs (for demo; use a DB in production)
const proofs: Record<string, any> = {};

export async function POST(req: NextRequest) {
  console.log('Reclaim webhook received');
  
  try {
    const { searchParams } = new URL(req.url);
    const rawbody = await req.text();
    const decoded = decodeURIComponent(rawbody);
    const body = JSON.parse(decoded);
    
    console.log('Webhook body:', JSON.stringify(body, null, 2));
  
  // Store the proof with multiple keys for maximum compatibility
  const timestamp = Date.now();
  const proofId = `proof_${timestamp}`;
  
  // Store with timestamp-based ID
  proofs[proofId] = body;
  
  // Store as latest
  proofs['latest'] = body;
  
  // Try to extract any possible identifier and store with that too
  let claimHash = '';
  if (body.claimData) {
    const claimString = JSON.stringify(body.claimData);
    claimHash = Buffer.from(claimString).toString('base64').slice(0, 16);
    proofs[`claim_${claimHash}`] = body;
  }
  
  // Store with provider-based key if available
  if (body.claimData && body.claimData.provider) {
    proofs[`${body.claimData.provider}_latest`] = body;
  }
  
  const storedKeys = [proofId, 'latest'];
  if (claimHash) storedKeys.push(`claim_${claimHash}`);
  if (body.claimData?.provider) storedKeys.push(`${body.claimData.provider}_latest`);
  
  console.log('Proof stored with keys:', storedKeys);
  console.log('All stored sessions:', Object.keys(proofs));
  
  return NextResponse.json({ status: 'ok', proofId, timestamp });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  console.log('Webhook GET request for sessionId:', sessionId);
  console.log('Available sessions:', Object.keys(proofs));
  
  // If no specific sessionId requested, return the latest proof
  if (!sessionId) {
    const latestProof = proofs['latest'];
    if (latestProof) {
      return NextResponse.json({ found: true, proof: latestProof, source: 'latest' });
    }
    return NextResponse.json({ found: false, availableSessions: Object.keys(proofs) });
  }
  
  // Try to find proof with exact sessionId
  let proof = proofs[sessionId];
  let source = 'exact';
  
  // If not found, try various fallback strategies
  if (!proof) {
    // Try partial matches
    for (const [key, value] of Object.entries(proofs)) {
      if (key.includes(sessionId) || sessionId.includes(key)) {
        proof = value;
        source = 'partial';
        break;
      }
    }
  }
  
  // Try latest as final fallback
  if (!proof && proofs['latest']) {
    proof = proofs['latest'];
    source = 'fallback';
  }
  
  if (!proof) {
    return NextResponse.json({ 
      found: false, 
      sessionId,
      availableSessions: Object.keys(proofs)
    });
  }
  
  return NextResponse.json({ found: true, proof, sessionId, source });
}