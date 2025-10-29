import { NextRequest, NextResponse } from 'next/server';
import { getOnchainVerificationService, type ProofGenerationOptions, EXAMPLE_PROOFS } from '@/lib/services/onchainVerification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofOptions, privateKey, useExample } = body;

    let options: ProofGenerationOptions;

    if (useExample) {
      // Use one of the predefined examples
      options = EXAMPLE_PROOFS.ethereum_price;
    } else if (proofOptions) {
      options = proofOptions;
    } else {
      return NextResponse.json(
        { error: 'Either proofOptions or useExample must be provided' },
        { status: 400 }
      );
    }

    const onchainService = getOnchainVerificationService();
    
    // Step 1: Generate proof
    console.log('Step 1: Generating proof...');
    const proof = await onchainService.generateProof(options);
    
    if (!proof) {
      throw new Error('Failed to generate proof');
    }

    // Step 2: Verify proof onchain
    console.log('Step 2: Verifying proof onchain...');
    const verificationResult = await onchainService.verifyProofOnchain(proof, privateKey);

    return NextResponse.json({ 
      success: true, 
      proof,
      verification: verificationResult,
      message: 'Proof generated and verified onchain successfully',
      explorerUrl: `${verificationResult.success ? 'https://sepolia-explorer.base.org/tx/' + verificationResult.transactionHash : ''}`
    });

  } catch (error: any) {
    console.error('Error in complete verification flow:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to complete verification flow',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Complete verification flow - generates proof and verifies onchain',
    method: 'POST',
    body: {
      useExample: 'boolean (optional) - use ethereum price example',
      proofOptions: {
        url: 'string (required if not using example)',
        method: 'GET | POST (optional)',
        responseMatches: 'array of { type: "regex" | "contains", value: string } (required)',
        headers: 'object (optional)'
      },
      privateKey: 'Ethereum private key (optional, uses env variable if not provided)'
    },
    examples: {
      useExample: {
        useExample: true
      },
      customProof: {
        proofOptions: {
          url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
          method: "GET",
          responseMatches: [
            {
              type: "regex",
              value: "\\{\"bitcoin\":\\{\"usd\":(?<price>[\\d\\.]+)\\}\\}"
            }
          ]
        }
      }
    }
  });
}
