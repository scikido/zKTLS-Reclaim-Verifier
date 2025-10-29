import { NextRequest, NextResponse } from 'next/server';

// Mock implementation for demonstration purposes
// This provides the same API structure but with simulated data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, responseMatches, headers } = body;

    if (!url || !responseMatches) {
      return NextResponse.json(
        { error: 'Missing required fields: url and responseMatches' },
        { status: 400 }
      );
    }

    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock proof structure similar to Reclaim Protocol
    const mockProof = {
      claimInfo: {
        provider: 'ethereum-price-coingecko',
        parameters: JSON.stringify({ url, method: method || 'GET' }),
        context: `{"contextAddress":"0x0","contextMessage":"ethereum price from coingecko","timestamp":"${Date.now()}"}`
      },
      signedClaim: {
        claim: {
          identifier: `0x${Buffer.from(url).toString('hex').padEnd(64, '0')}`,
          owner: '0x0000000000000000000000000000000000000000',
          timestampS: Math.floor(Date.now() / 1000),
          epoch: 1
        },
        signatures: [
          `0x${'a'.repeat(128)}`, // Mock signature
          `0x${'b'.repeat(128)}`, // Mock signature
        ]
      },
      witnesses: [
        {
          addr: '0x1111111111111111111111111111111111111111',
          host: 'witness1.reclaimprotocol.org'
        },
        {
          addr: '0x2222222222222222222222222222222222222222', 
          host: 'witness2.reclaimprotocol.org'
        }
      ]
    };

    // Simulate fetching actual data (for demonstration)
    if (url.includes('coingecko') && url.includes('ethereum')) {
      try {
        const response = await fetch(url);
        const data = await response.text();
        console.log('Fetched data from:', url);
        console.log('Response preview:', data.substring(0, 100) + '...');
      } catch (error) {
        console.log('Could not fetch actual data, using mock proof anyway');
      }
    }

    return NextResponse.json({ 
      success: true, 
      proof: mockProof,
      message: 'Mock proof generated successfully (for demonstration)',
      note: 'This is a demonstration proof. In production, this would use Reclaim Protocol zkFetch.'
    });

  } catch (error: any) {
    console.error('Error generating mock proof:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate proof',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Mock proof generation endpoint (for demonstration)',
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
    },
    note: "This is a mock implementation for demonstration. Replace with actual Reclaim Protocol integration when packages are compatible."
  });
}
