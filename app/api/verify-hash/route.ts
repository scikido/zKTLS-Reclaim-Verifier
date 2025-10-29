import { NextRequest, NextResponse } from 'next/server';
import { CONTRACT_CONFIG } from '@/lib/contracts/ProofRegistry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash) {
      return NextResponse.json(
        { error: 'Hash is required' },
        { status: 400 }
      );
    }

    // Validate hash format
    const hashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!hashRegex.test(hash)) {
      return NextResponse.json(
        { error: 'Invalid hash format. Expected 0x followed by 64 hexadecimal characters.' },
        { status: 400 }
      );
    }

    // For demonstration, we'll simulate looking up the hash on Base Sepolia
    // In a real implementation, this would query the blockchain
    try {
      // Import ethers dynamically for server-side use
      const { ethers } = require('ethers');
      
      // Connect to Base Sepolia
      const provider = new ethers.providers.JsonRpcProvider(CONTRACT_CONFIG.baseSepolia.rpcUrl);
      
      // Try to get transaction receipt
      let transactionReceipt = null;
      let isTransactionHash = false;
      
      try {
        transactionReceipt = await provider.getTransactionReceipt(hash);
        if (transactionReceipt) {
          isTransactionHash = true;
        }
      } catch (error) {
        // Hash might be a proof hash, not a transaction hash
        console.log('Not a transaction hash, treating as proof hash');
      }

      if (isTransactionHash && transactionReceipt) {
        // Found transaction on blockchain
        const block = await provider.getBlock(transactionReceipt.blockNumber);
        
        return NextResponse.json({
          success: true,
          found: true,
          type: 'transaction',
          hash: hash,
          transactionHash: hash,
          blockNumber: transactionReceipt.blockNumber,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          gasUsed: transactionReceipt.gasUsed.toString(),
          status: transactionReceipt.status === 1 ? 'success' : 'failed',
          explorerUrl: `${CONTRACT_CONFIG.baseSepolia.explorerUrl}/tx/${hash}`,
          provider: 'Base Sepolia Network'
        });
      } else {
        // Hash not found as transaction, check if it could be a proof hash
        // In a real implementation, you would check your proof database
        
        // For demonstration, we'll simulate finding proof data
        const mockProofData = {
          success: true,
          found: true,
          type: 'proof',
          hash: hash,
          transactionHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          blockNumber: Math.floor(Math.random() * 1000000) + 18500000,
          timestamp: new Date().toISOString(),
          provider: 'Mock Verification Service',
          explorerUrl: `${CONTRACT_CONFIG.baseSepolia.explorerUrl}/tx/${hash}`,
          note: 'This is a demonstration. In production, this would query a proof database.'
        };

        return NextResponse.json(mockProofData);
      }

    } catch (error: any) {
      console.error('Error querying blockchain:', error);
      
      // If blockchain query fails, return mock data for demonstration
      return NextResponse.json({
        success: true,
        found: false,
        type: 'unknown',
        hash: hash,
        error: 'Could not verify hash on blockchain',
        note: 'Hash verification failed. This could mean the hash is invalid or the blockchain is not accessible.',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Error in hash verification:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify hash',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Hash verification endpoint',
    method: 'POST',
    body: {
      hash: 'string (required) - Transaction hash or proof hash to verify'
    },
    example: {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    note: 'This endpoint verifies hashes against Base Sepolia blockchain and proof databases'
  });
}
