import { NextRequest, NextResponse } from 'next/server';

// In-memory store for proofs (for demo; use a DB in production)
const proofs: Record<string, any> = {};

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Assume body contains a sessionId or unique identifier
  if (!body.sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  proofs[body.sessionId] = body;
  return NextResponse.json({ status: 'ok' });
}

// For frontend polling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  const proof = proofs[sessionId];
  if (!proof) {
    return NextResponse.json({ found: false });
  }
  return NextResponse.json({ found: true, proof });
} 