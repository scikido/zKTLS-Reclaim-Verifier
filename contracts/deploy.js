/**
 * Deployment script for ProofRegistry contract
 * This script can be used with Remix IDE or other deployment tools
 */

// Contract deployment configuration
const DEPLOYMENT_CONFIG = {
    // Sepolia testnet configuration
    sepolia: {
        name: "Sepolia Testnet",
        chainId: 11155111,
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        explorerUrl: "https://sepolia.etherscan.io"
    },
    // Base testnet configuration (for future use)
    baseTestnet: {
        name: "Base Sepolia",
        chainId: 84532,
        rpcUrl: "https://sepolia.base.org",
        explorerUrl: "https://sepolia-explorer.base.org"
    }
};

/**
 * Deploy ProofRegistry contract
 * Instructions for Remix IDE deployment:
 * 
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create new file: contracts/ProofRegistry.sol
 * 3. Copy the ProofRegistry.sol contract code
 * 4. Compile with Solidity 0.8.19+
 * 5. Connect to Sepolia testnet via MetaMask
 * 6. Deploy the contract
 * 7. Verify on Etherscan using the contract source code
 * 8. Update the contract address in your frontend environment variables
 */

// Example deployment parameters (for reference)
const DEPLOYMENT_PARAMS = {
    gasLimit: 2000000,
    gasPrice: "20000000000", // 20 gwei
    confirmations: 2
};

// Contract ABI for frontend integration
const CONTRACT_ABI = [
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
        "inputs": [{"internalType": "bytes32", "name": "proofHash", "type": "bytes32"}],
        "name": "proofExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
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
];

module.exports = {
    DEPLOYMENT_CONFIG,
    DEPLOYMENT_PARAMS,
    CONTRACT_ABI
};