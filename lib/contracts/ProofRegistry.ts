/**
 * TypeScript interfaces and utilities for ProofRegistry smart contract
 */

// Contract ABI for ethers.js integration
export const PROOF_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "bytes", "name": "proofData", "type": "bytes"},
      {"internalType": "string", "name": "provider", "type": "string"}
    ],
    "name": "submitProof",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "proofHash", "type": "bytes32"}],
    "name": "verifyProof",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
          {"internalType": "address", "name": "submitter", "type": "address"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "string", "name": "provider", "type": "string"},
          {"internalType": "bool", "name": "isValid", "type": "bool"}
        ],
        "internalType": "struct ProofRegistry.ProofRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserProofs",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserProofCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "proofHash", "type": "bytes32"}],
    "name": "proofExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "submitter", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "provider", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ProofSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "querier", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ProofQueried",
    "type": "event"
  }
] as const;

// TypeScript interfaces for contract interaction
export interface ProofRecord {
  proofHash: string;
  submitter: string;
  timestamp: bigint;
  provider: string;
  isValid: boolean;
}

export interface OnchainProofRecord extends ProofRecord {
  transactionHash: string;
  blockNumber: number;
}

export interface ProofSubmissionResult {
  proofHash: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

export interface ContractError {
  code: string;
  message: string;
  reason?: string;
}

// Contract configuration
export const CONTRACT_CONFIG = {
  // Sepolia testnet configuration
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.etherscan.io",
    contractAddress: process.env.NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS || "",
  },
  // Base testnet configuration (for future use)
  baseTestnet: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia-explorer.base.org",
    contractAddress: "", // To be set when deployed
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

export default {
  PROOF_REGISTRY_ABI,
  CONTRACT_CONFIG,
  CONTRACT_ERRORS,
  GAS_ESTIMATES,
  ContractUtils
};