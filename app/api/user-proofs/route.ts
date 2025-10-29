import { NextRequest, NextResponse } from 'next/server';
import { CONTRACT_CONFIG } from '@/lib/contracts/ProofRegistry';

// In-memory storage for demo (in production, use a database)
const userProofsStorage = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    // Get stored proofs for user
    const userProofs = userProofsStorage.get(userAddress.toLowerCase()) || [];

    // Also try to fetch from blockchain if we have ethers available
    let blockchainProofs: any[] = [];
    
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.providers.JsonRpcProvider(CONTRACT_CONFIG.baseSepolia.rpcUrl);
      
      // Get recent transactions for the user address
      // Note: This is a simplified approach - in production you'd use event logs
      const latestBlock = await provider.getBlockNumber();
      const startBlock = Math.max(0, latestBlock - 10000); // Last ~10k blocks
      
      // Search for transactions from this address
      for (let i = Math.max(0, latestBlock - 100); i <= latestBlock; i++) {
        try {
          const block = await provider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from?.toLowerCase() === userAddress.toLowerCase() && 
                  tx.value && 
                  ethers.utils.formatEther(tx.value) === '0.001') {
                
                // This looks like a verification transaction
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt && receipt.status === 1) {
                  blockchainProofs.push({
                    proofHash: tx.hash,
                    submitter: userAddress,
                    timestamp: BigInt(block.timestamp),
                    provider: 'Blockchain Verification',
                    isValid: true,
                    transactionHash: tx.hash,
                    blockNumber: block.number,
                    gasUsed: receipt.gasUsed.toString(),
                    value: ethers.utils.formatEther(tx.value)
                  });
                }
              }
            }
          }
        } catch (blockError) {
          // Skip blocks that can't be fetched
          continue;
        }
      }
    } catch (error: any) {
      console.log('Could not fetch blockchain data:', error.message);
    }

    // Combine stored proofs with blockchain proofs
    const allProofs = [...userProofs, ...blockchainProofs];
    
    // Remove duplicates based on transaction hash
    const uniqueProofs = allProofs.filter((proof, index, self) => 
      index === self.findIndex(p => p.transactionHash === proof.transactionHash)
    );

    // Sort by timestamp (newest first)
    uniqueProofs.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return NextResponse.json({
      success: true,
      proofs: uniqueProofs,
      count: uniqueProofs.length,
      address: userAddress
    });

  } catch (error: any) {
    console.error('Error fetching user proofs:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch user proofs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, proof } = body;

    if (!userAddress || !proof) {
      return NextResponse.json(
        { error: 'User address and proof data are required' },
        { status: 400 }
      );
    }

    // Store proof for user
    const userProofs = userProofsStorage.get(userAddress.toLowerCase()) || [];
    
    // Add timestamp if not present
    if (!proof.timestamp) {
      proof.timestamp = BigInt(Math.floor(Date.now() / 1000));
    }

    userProofs.push(proof);
    userProofsStorage.set(userAddress.toLowerCase(), userProofs);

    return NextResponse.json({
      success: true,
      message: 'Proof stored successfully',
      proofCount: userProofs.length
    });

  } catch (error: any) {
    console.error('Error storing user proof:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to store proof',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
