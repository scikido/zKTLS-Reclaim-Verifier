import { NextRequest, NextResponse } from 'next/server';

// Mock implementation for complete verification flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { useExample, proofOptions } = body;

    let mockUrl: string;
    let mockProvider: string;

    if (useExample) {
      mockUrl = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
      mockProvider = "ethereum-price-coingecko";
    } else if (proofOptions?.url) {
      mockUrl = proofOptions.url;
      mockProvider = "custom-api";
    } else {
      return NextResponse.json(
        { error: 'Either useExample or proofOptions must be provided' },
        { status: 400 }
      );
    }

    console.log('Mock: Starting complete verification flow...');
    console.log('Mock: Generating proof for:', mockUrl);

    // Simulate proof generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock proof structure
    const mockProof = {
      claimInfo: {
        provider: mockProvider,
        parameters: JSON.stringify({ url: mockUrl, method: 'GET' }),
        context: `{"contextAddress":"0x0","contextMessage":"${mockProvider} data","timestamp":"${Date.now()}"}`
      },
      signedClaim: {
        claim: {
          identifier: `0x${Buffer.from(mockUrl).toString('hex').padEnd(64, '0')}`,
          owner: '0x0000000000000000000000000000000000000000',
          timestampS: Math.floor(Date.now() / 1000),
          epoch: 1
        },
        signatures: [
          `0x${'a'.repeat(128)}`,
          `0x${'b'.repeat(128)}`,
        ]
      }
    };

    console.log('Mock: Proof generated, now verifying onchain...');

    // Simulate onchain verification
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockBlockNumber = Math.floor(Math.random() * 1000000) + 18500000;
    const mockGasUsed = BigInt(Math.floor(Math.random() * 50000) + 150000);

    const verification = {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      gasUsed: mockGasUsed,
      provider: mockProvider
    };

    // Try to fetch real data for demonstration (if possible)
    let actualData = null;
    if (mockUrl.includes('coingecko')) {
      try {
        const response = await fetch(mockUrl);
        actualData = await response.json();
        console.log('Mock: Successfully fetched real data from API for demonstration');
      } catch (error) {
        console.log('Mock: Could not fetch real data, continuing with mock proof');
      }
    }

    return NextResponse.json({ 
      success: true, 
      proof: mockProof,
      verification,
      actualData, // Include real data if fetched, for demonstration
      message: 'Mock complete verification flow successful',
      explorerUrl: `https://sepolia-explorer.base.org/tx/${mockTxHash}`,
      note: 'This is a demonstration using mock blockchain transactions. The proof structure follows Reclaim Protocol standards.',
      realDataNote: actualData ? 'Real API data was fetched for demonstration, but the proof is still mocked.' : 'No real data fetched.'
    });

  } catch (error: any) {
    console.error('Error in mock complete verification flow:', error);
    
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
    message: 'Mock complete verification flow (for demonstration)',
    method: 'POST',
    body: {
      useExample: 'boolean (optional) - use ethereum price example',
      proofOptions: {
        url: 'string (required if not using example)',
        method: 'GET | POST (optional)',
        responseMatches: 'array of match patterns (optional for mock)',
        headers: 'object (optional)'
      }
    },
    examples: {
      useExample: {
        useExample: true
      },
      customProof: {
        proofOptions: {
          url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
          method: "GET"
        }
      }
    },
    note: 'This endpoint demonstrates the complete flow with mock blockchain transactions and proof structures that follow Reclaim Protocol standards.'
  });
}
