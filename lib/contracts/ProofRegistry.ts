/**
 * TypeScript interfaces and utilities for Reclaim Protocol smart contract
 */

// Official Reclaim Protocol Contract ABI (verifyProof function)
export const RECLAIM_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "Reclaim__GroupAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Reclaim__UserAlreadyMerkelized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "provider",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "parameters",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "context",
                "type": "string"
              }
            ],
            "internalType": "struct Claims.ClaimInfo",
            "name": "claimInfo",
            "type": "tuple"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes32",
                    "name": "identifier",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                  },
                  {
                    "internalType": "uint32",
                    "name": "timestampS",
                    "type": "uint32"
                  },
                  {
                    "internalType": "uint32",
                    "name": "epoch",
                    "type": "uint32"
                  }
                ],
                "internalType": "struct Claims.CompleteClaimData",
                "name": "claim",
                "type": "tuple"
              },
              {
                "internalType": "bytes[]",
                "name": "signatures",
                "type": "bytes[]"
              }
            ],
            "internalType": "struct Claims.SignedClaim",
            "name": "signedClaim",
            "type": "tuple"
          }
        ],
        "internalType": "struct Reclaim.Proof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "verifyProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "provider",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "parameters",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "context",
                "type": "string"
              }
            ],
            "internalType": "struct Claims.ClaimInfo",
            "name": "claimInfo",
            "type": "tuple"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes32",
                    "name": "identifier",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                  },
                  {
                    "internalType": "uint32",
                    "name": "timestampS",
                    "type": "uint32"
                  },
                  {
                    "internalType": "uint32",
                    "name": "epoch",
                    "type": "uint32"
                  }
                ],
                "internalType": "struct Claims.CompleteClaimData",
                "name": "claim",
                "type": "tuple"
              },
              {
                "internalType": "bytes[]",
                "name": "signatures",
                "type": "bytes[]"
              }
            ],
            "internalType": "struct Claims.SignedClaim",
            "name": "signedClaim",
            "type": "tuple"
          }
        ],
        "internalType": "struct Reclaim.Proof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "getProviderFromProof",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;

// TypeScript interfaces for Reclaim Protocol proof structure
export interface ClaimInfo {
  provider: string;
  parameters: string;
  context: string;
}

export interface CompleteClaimData {
  identifier: string;
  owner: string;
  timestampS: number;
  epoch: number;
}

export interface SignedClaim {
  claim: CompleteClaimData;
  signatures: string[];
}

export interface ReclaimProof {
  claimInfo: ClaimInfo;
  signedClaim: SignedClaim;
}

export interface OnchainVerificationResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint | string; // Can be bigint for real transactions or string for mock/serialization
  provider?: string;
}

export interface OnchainProofRecord {
  proofHash: string;
  submitter: string;
  timestamp: bigint;
  provider: string;
  isValid: boolean;
  transactionHash: string;
  blockNumber: number;
}

export interface ContractError {
  code: string;
  message: string;
  reason?: string;
}

// Contract configuration for different networks
export const CONTRACT_CONFIG = {
  // Base Sepolia testnet (primary network)
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia-explorer.base.org",
    contractAddress: "0x773abD95bfF76FF1228E9e046dE68C25B905e45A", // Your address for testing
  },
  // Ethereum Sepolia testnet (fallback)
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.etherscan.io",
    contractAddress: "0x773abD95bfF76FF1228E9e046dE68C25B905e45A", // Your address for testing
  }
};

// Error mappings for better user experience
export const CONTRACT_ERRORS = {
  InvalidProofStructure: "The proof data is invalid or malformed",
  ProofAlreadyExists: "This proof has already been submitted to the blockchain",
  InvalidSignature: "The proof signature is invalid",
  InsufficientWitnesses: "The proof does not have enough witnesses",
  EmptyProvider: "Provider name cannot be empty",
  InvalidProofHash: "The proof hash is invalid",
  InsufficientFunds: "Insufficient funds to pay for gas",
  UserRejected: "Transaction was rejected by the user",
  NetworkError: "Network error occurred. Please try again",
  ContractNotDeployed: "Smart contract is not deployed on this network"
};

// Gas estimation constants
export const GAS_ESTIMATES = {
  SUBMIT_PROOF: BigInt(150000),
  VERIFY_PROOF: BigInt(50000),
  GET_USER_PROOFS: BigInt(30000),
  PROOF_EXISTS: BigInt(25000)
};

// Utility functions for contract interaction
export const ContractUtils = {
  /**
   * Format proof hash for display
   */
  formatProofHash: (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp: (timestamp: bigint): string => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  },

  /**
   * Format address for display
   */
  formatAddress: (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  /**
   * Get explorer URL for transaction
   */
  getTransactionUrl: (txHash: string, chainId: number): string => {
    const config = Object.values(CONTRACT_CONFIG).find(c => c.chainId === chainId);
    return config ? `${config.explorerUrl}/tx/${txHash}` : "";
  },

  /**
   * Get explorer URL for address
   */
  getAddressUrl: (address: string, chainId: number): string => {
    const config = Object.values(CONTRACT_CONFIG).find(c => c.chainId === chainId);
    return config ? `${config.explorerUrl}/address/${address}` : "";
  },

  /**
   * Parse contract error message
   */
  parseContractError: (error: any): string => {
    if (error.reason) {
      return CONTRACT_ERRORS[error.reason as keyof typeof CONTRACT_ERRORS] || error.reason;
    }
    if (error.code === 4001) {
      return CONTRACT_ERRORS.UserRejected;
    }
    if (error.code === -32603) {
      return CONTRACT_ERRORS.InsufficientFunds;
    }
    return CONTRACT_ERRORS.NetworkError;
  }
};

const ProofRegistryExports = {
  RECLAIM_CONTRACT_ABI,
  CONTRACT_CONFIG,
  CONTRACT_ERRORS,
  GAS_ESTIMATES,
  ContractUtils
};

export default ProofRegistryExports;