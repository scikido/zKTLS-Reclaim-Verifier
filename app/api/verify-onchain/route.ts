import { NextRequest, NextResponse } from 'next/server';
import { getOnchainVerificationService } from '@/lib/services/onchainVerification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proof, privateKey } = body;

    if (!proof) {
      return NextResponse.json(
        { error: 'Missing proof data' },
        { status: 400 }
      );
    }

    const onchainService = getOnchainVerificationService();
    
    // Verify proof on blockchain
    const result = await onchainService.verifyProofOnchain(proof, privateKey);

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Proof verified onchain successfully' 
    });

  } catch (error: any) {
    console.error('Error verifying proof onchain:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify proof onchain',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Onchain verification endpoint',
    method: 'POST',
    body: {
      proof: 'Reclaim proof object (required)',
      privateKey: 'Ethereum private key (optional, uses env variable if not provided)'
    },
    note: 'This endpoint submits the proof to the blockchain for permanent verification'
  });
}
