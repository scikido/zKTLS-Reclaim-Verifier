const { ReclaimClient } = require("@reclaimprotocol/zk-fetch");
const transformForOnchain = require("@reclaimprotocol/js-sdk");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: '.env.local' });

// Reclaim Protocol Contract ABI (verifyProof function)
const contractABI = [
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
  }
];

async function verifyProof() {
  console.log("🚀 Starting Reclaim Protocol Onchain Verification...\n");

  // Check required environment variables
  const requiredEnvVars = ['APP_ID', 'APP_SECRET', 'RPC_URL', 'PRIVATE_KEY', 'CONTRACT_ADDRESS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:", missingVars.join(', '));
    console.error("Please check your .env.local file and ensure all variables are set.");
    process.exit(1);
  }

  // Initialize the ReclaimClient
  console.log("📋 Initializing Reclaim Client...");
  const reclaimClient = new ReclaimClient(
    process.env.APP_ID,
    process.env.APP_SECRET
  );

  try {
    // Example URL to fetch data from (Ethereum price from CoinGecko)
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
    
    console.log("🔍 Generating proof for:", url);
    console.log("⏳ This may take a few moments...\n");

    // Generate the proof using zkFetch
    const proof = await reclaimClient.zkFetch(
      url,
      { method: "GET" },
      {
        responseMatches: [
          {
            type: "regex",
            value: '\\{"ethereum":\\{"usd":(?<price>[\\d\\.]+)\\}\\}',
          },
        ],
      }
    );

    if (!proof) {
      console.error("❌ Failed to generate proof");
      process.exit(1);
    }

    console.log("✅ Proof generated successfully!");
    console.log("📊 Proof contains data about Ethereum price from CoinGecko\n");

    // Initialize blockchain connection
    console.log("🔗 Connecting to blockchain...");
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      signer
    );

    // Check wallet balance
    const balance = await signer.getBalance();
    const balanceEth = ethers.utils.formatEther(balance);
    console.log(`💰 Wallet balance: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) < 0.001) {
      console.warn("⚠️  Low wallet balance. You may need more ETH for gas fees.");
    }

    // Transform proof for onchain submission
    console.log("🔧 Transforming proof for onchain submission...");
    const proofData = await transformForOnchain(proof);

    if (!proofData) {
      console.error("❌ Failed to transform proof for onchain verification");
      process.exit(1);
    }

    console.log("✅ Proof transformed successfully!");

    // Estimate gas cost
    console.log("⛽ Estimating gas cost...");
    try {
      const gasEstimate = await contract.estimateGas.verifyProof(proofData);
      const gasPrice = await provider.getGasPrice();
      const estimatedCost = gasEstimate.mul(gasPrice);
      console.log(`📊 Estimated gas: ${gasEstimate.toString()}`);
      console.log(`💵 Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH\n`);
    } catch (gasError) {
      console.log("⚠️  Could not estimate gas cost, proceeding anyway...\n");
    }

    // Submit proof verification transaction
    console.log("📤 Submitting proof verification to blockchain...");
    const tx = await contract.verifyProof(proofData, {
      gasLimit: 300000, // Set a reasonable gas limit
    });

    console.log("🔄 Transaction submitted!");
    console.log(`📋 Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...\n");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log("🎉 SUCCESS! Proof verified onchain!");
    console.log(`📋 Transaction hash: ${tx.hash}`);
    console.log(`🏗️  Block number: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`💰 Gas cost: ${ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))} ETH`);
    
    // Generate explorer URLs
    const network = process.env.RPC_URL.includes('sepolia.base.org') ? 'base-sepolia' : 'sepolia';
    const explorerUrl = network === 'base-sepolia' 
      ? `https://sepolia-explorer.base.org/tx/${tx.hash}`
      : `https://sepolia.etherscan.io/tx/${tx.hash}`;
    
    console.log(`🔍 View on explorer: ${explorerUrl}`);
    
    console.log("\n✨ Verification complete! Your proof is now permanently recorded on the blockchain.");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during verification:", error.message);
    
    // Provide more specific error messages
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error("💸 Insufficient funds to pay for gas. Please add ETH to your wallet.");
    } else if (error.code === 'NETWORK_ERROR') {
      console.error("🌐 Network error. Please check your RPC URL and internet connection.");
    } else if (error.reason) {
      console.error("📋 Contract error:", error.reason);
    }
    
    console.error("\nℹ️  Make sure:");
    console.error("  - Your wallet has enough ETH for gas fees");
    console.error("  - The contract address is correct");
    console.error("  - Your private key is valid");
    console.error("  - The RPC URL is accessible");
    
    process.exit(1);
  }
}

// Run the verification function
console.log("🔐 zKTLS Reclaim Protocol Onchain Verifier");
console.log("==========================================\n");
verifyProof();
