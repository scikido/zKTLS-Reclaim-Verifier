// Server-side only imports to avoid webpack issues with native binaries
let ReclaimClient: any;
let ethers: any;
let transformForOnchain: any;

// Dynamic imports for server-side only
if (typeof window === 'undefined') {
  try {
    ReclaimClient = require("@reclaimprotocol/zk-fetch").ReclaimClient;
    ethers = require("ethers");
    transformForOnchain = require("@reclaimprotocol/js-sdk");
  } catch (error) {
    console.warn('Failed to load server-side dependencies:', error);
  }
}

import { RECLAIM_CONTRACT_ABI, CONTRACT_CONFIG, type ReclaimProof, type OnchainVerificationResult } from "@/lib/contracts/ProofRegistry";

export interface ProofGenerationOptions {
  url: string;
  method?: 'GET' | 'POST';
  responseMatches: Array<{
    type: 'regex' | 'contains';
    value: string;
  }>;
  headers?: Record<string, string>;
  body?: string;
}

export interface OnchainVerificationService {
  generateProof(options: ProofGenerationOptions): Promise<any>;
  verifyProofOnchain(proof: any, privateKey?: string): Promise<OnchainVerificationResult>;
  getProofProvider(proof: any): Promise<string>;
}

class ReclaimOnchainVerificationService implements OnchainVerificationService {
  private reclaimClient: any;
  private provider: any;
  private contract: any;

  constructor() {
    // Only initialize on server side
    if (typeof window === 'undefined' && ReclaimClient && ethers) {
      const appId = process.env.APP_ID || process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
      const appSecret = process.env.APP_SECRET || process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET;
      
      if (!appId || !appSecret) {
        throw new Error('Missing Reclaim Protocol credentials');
      }

      this.reclaimClient = new ReclaimClient(appId, appSecret);
      
      // Initialize blockchain connection
      const rpcUrl = process.env.RPC_URL || CONTRACT_CONFIG.baseSepolia.rpcUrl;
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      const contractAddress = process.env.CONTRACT_ADDRESS || CONTRACT_CONFIG.baseSepolia.contractAddress;
      this.contract = new ethers.Contract(contractAddress, RECLAIM_CONTRACT_ABI, this.provider);
    } else if (typeof window !== 'undefined') {
      throw new Error('OnchainVerificationService can only be used on the server side');
    }
  }

  /**
   * Generate a zero-knowledge proof using ReclaimClient
   */
  async generateProof(options: ProofGenerationOptions): Promise<any> {
    try {
      console.log('Generating proof for URL:', options.url);
      
      const proof = await this.reclaimClient.zkFetch(
        options.url,
        { 
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body
        },
        {
          responseMatches: options.responseMatches
        }
      );

      if (!proof) {
        throw new Error('Failed to generate proof');
      }

      console.log('Proof generated successfully');
      return proof;
    } catch (error: any) {
      console.error('Error generating proof:', error);
      throw new Error(`Proof generation failed: ${error.message}`);
    }
  }

  /**
   * Verify proof on blockchain
   */
  async verifyProofOnchain(proof: any, privateKey?: string): Promise<OnchainVerificationResult> {
    try {
      // Use provided private key or environment variable
      const pk = privateKey || process.env.PRIVATE_KEY;
      if (!pk) {
        throw new Error('Private key required for onchain verification');
      }

      // Create signer
      const signer = new ethers.Wallet(pk, this.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Transform proof for onchain submission
      console.log('Transforming proof for onchain submission...');
      const proofData = await transformForOnchain(proof);
      
      if (!proofData) {
        throw new Error('Failed to transform proof for onchain verification');
      }

      console.log('Submitting proof to blockchain...');
      
      // Submit proof verification transaction
      const tx = await contractWithSigner.verifyProof(proofData, {
        gasLimit: 300000, // Set reasonable gas limit
      });

      console.log('Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Extract provider from proof
      const provider = await this.getProofProvider(proof);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        provider
      };

    } catch (error: any) {
      console.error('Error verifying proof onchain:', error);
      throw new Error(`Onchain verification failed: ${error.message}`);
    }
  }

  /**
   * Extract provider name from proof
   */
  async getProofProvider(proof: any): Promise<string> {
    try {
      // Transform proof and extract provider
      const proofData = await transformForOnchain(proof);
      return await this.contract.getProviderFromProof(proofData);
    } catch (error) {
      console.error('Error extracting provider:', error);
      return proof?.claimData?.provider || 'unknown';
    }
  }

  /**
   * Check if wallet has sufficient funds for verification
   */
  async checkWalletBalance(address: string): Promise<{ sufficient: boolean; balance: string }> {
    try {
      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.utils.formatEther(balance);
      const sufficient = parseFloat(balanceInEth) > 0.001; // Need at least 0.001 ETH for gas
      
      return {
        sufficient,
        balance: balanceInEth
      };
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return { sufficient: false, balance: '0' };
    }
  }

  /**
   * Estimate gas cost for proof verification
   */
  async estimateGasCost(proof: any): Promise<{ gasEstimate: string; costInEth: string }> {
    try {
      const proofData = await transformForOnchain(proof);
      const gasEstimate = await this.contract.estimateGas.verifyProof(proofData);
      const gasPrice = await this.provider.getGasPrice();
      const costInWei = gasEstimate.mul(gasPrice);
      const costInEth = ethers.utils.formatEther(costInWei);

      return {
        gasEstimate: gasEstimate.toString(),
        costInEth
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      return {
        gasEstimate: '200000', // fallback estimate
        costInEth: '0.001'
      };
    }
  }
}

// Singleton instance
let onchainService: ReclaimOnchainVerificationService | null = null;

export function getOnchainVerificationService(): ReclaimOnchainVerificationService {
  if (!onchainService) {
    onchainService = new ReclaimOnchainVerificationService();
  }
  return onchainService;
}

// Example proof generation configurations
export const EXAMPLE_PROOFS = {
  ethereum_price: {
    url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    method: 'GET' as const,
    responseMatches: [
      {
        type: 'regex' as const,
        value: '\\{"ethereum":\\{"usd":(?<price>[\\d\\.]+)\\}\\}'
      }
    ]
  },
  github_profile: {
    url: "https://api.github.com/user",
    method: 'GET' as const,
    responseMatches: [
      {
        type: 'regex' as const,
        value: '"login":"(?<username>[^"]+)"'
      }
    ],
    headers: {
      'Authorization': 'token YOUR_GITHUB_TOKEN'
    }
  },
  weather_api: {
    url: "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY",
    method: 'GET' as const,
    responseMatches: [
      {
        type: 'regex' as const,
        value: '"temp":(?<temperature>[\\d\\.]+)'
      }
    ]
  }
};

export default getOnchainVerificationService;
