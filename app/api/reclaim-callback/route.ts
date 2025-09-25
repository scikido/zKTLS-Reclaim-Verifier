import { NextRequest, NextResponse } from 'next/server';

// In-memory store for proofs (for demo; use a DB in production)
const proofs: Record<string, any> = {};

export async function POST(req: NextRequest) {
  const rawbody = await req.text();
  const decoded =  decodeURIComponent(rawbody)
  const body = await JSON.parse(decoded);
  // Assume body contains a sessionId or unique identifier
  console.log("body",body);
  if (!body.identifier) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  proofs[body.identifier] = body;
  return NextResponse.json({ status: 'ok' });
}

// For frontend polling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  console.log("proofs",proofs)
  const proof = proofs[sessionId];
  if (!proof) {
    return NextResponse.json({ found: false });
  }
  return NextResponse.json({ found: true, proof });
} 