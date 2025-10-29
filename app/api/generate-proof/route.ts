import { NextRequest, NextResponse } from 'next/server';
import { getOnchainVerificationService, type ProofGenerationOptions } from '@/lib/services/onchainVerification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a proof transformation request
    if (body.proof && !body.url) {
      // Transform existing proof for onchain submission
      const onchainService = getOnchainVerificationService();
      const transformedProof = await onchainService.transformProofForOnchain(body.proof);
      
      return NextResponse.json({ 
        success: true, 
        transformedProof,
        message: 'Proof transformed for onchain submission' 
      });
    }
    
    // Otherwise, generate new proof
    const { url, method, responseMatches, headers } = body as ProofGenerationOptions;

    if (!url || !responseMatches) {
      return NextResponse.json(
        { error: 'Missing required fields: url and responseMatches (or proof for transformation)' },
        { status: 400 }
      );
    }

    const onchainService = getOnchainVerificationService();
    
    // Generate proof using zkFetch
    const proof = await onchainService.generateProof({
      url,
      method: method || 'GET',
      responseMatches,
      headers
    });

    return NextResponse.json({ 
      success: true, 
      proof,
      message: 'Proof generated successfully' 
    });

  } catch (error: any) {
    console.error('Error generating/transforming proof:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate/transform proof',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Proof generation endpoint',
    method: 'POST',
    body: {
      url: 'string (required)',
      method: 'GET | POST (optional, default: GET)',
      responseMatches: 'array of { type: "regex" | "contains", value: string } (required)',
      headers: 'object (optional)'
    },
    example: {
      url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      method: "GET",
      responseMatches: [
        {
          type: "regex",
          value: "\\{\"ethereum\":\\{\"usd\":(?<price>[\\d\\.]+)\\}\\}"
        }
      ]
    }
  });
}
