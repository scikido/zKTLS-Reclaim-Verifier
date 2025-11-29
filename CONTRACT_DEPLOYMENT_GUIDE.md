# SimpleVerificationContract Deployment Guide

## Issue Summary

You're getting a "transaction failed" error because:

1. **Contract Address Mismatch**: The code is configured to use the Reclaim Protocol contract address (`0xF90085f5Fd1a3bEb8678623409b3811eCeC5f6A5`), but your code is calling `SimpleVerificationContract.verifyProof(bytes32, string)` which has a different function signature than the Reclaim Protocol contract.

2. **Provider Extraction**: The provider name is being extracted as "http" instead of a valid provider name, which suggests the proof structure may not match expectations.

## Solution

### Step 1: Deploy Your SimpleVerificationContract

You need to deploy your `SimpleVerificationContract` to Base Sepolia testnet. Here's how:

#### Using Remix IDE (Recommended for Quick Testing)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file called `SimpleVerificationContract.sol`
3. Paste your contract code:
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   contract SimpleVerificationContract {
       event ProofVerified(
           address indexed user,
           bytes32 indexed proofHash,
           string provider,
           uint256 timestamp
       );
       
       mapping(bytes32 => bool) public verifiedProofs;
       mapping(address => uint256) public userProofCount;
       
       function verifyProof(bytes32 proofHash, string memory provider) external payable {
           require(!verifiedProofs[proofHash], "Proof already verified");
           
           verifiedProofs[proofHash] = true;
           userProofCount[msg.sender]++;
           
           emit ProofVerified(msg.sender, proofHash, provider, block.timestamp);
       }
       
       function isProofVerified(bytes32 proofHash) external view returns (bool) {
           return verifiedProofs[proofHash];
       }
       
       function getUserProofCount(address user) external view returns (uint256) {
           return userProofCount[user];
       }
       
       function withdraw() external {
           payable(msg.sender).transfer(address(this).balance);
       }
   }
   ```

4. Compile the contract:
   - Go to "Solidity Compiler" tab
   - Select compiler version `0.8.0` or higher
   - Click "Compile SimpleVerificationContract.sol"

5. Deploy to Base Sepolia:
   - Go to "Deploy & Run Transactions" tab
   - In "Environment", select "Injected Provider - MetaMask"
   - Connect your MetaMask wallet
   - Switch MetaMask to Base Sepolia network (Chain ID: 84532)
   - Click "Deploy"
   - Confirm the transaction in MetaMask
   - **Copy the deployed contract address** from Remix

#### Using Hardhat (For More Control)

1. Create a `contracts/SimpleVerificationContract.sol` file with your contract
2. Create a deployment script
3. Deploy using: `npx hardhat run scripts/deploy.js --network baseSepolia`

### Step 2: Update Contract Address Configuration

After deploying, you need to set the contract address in your application:

#### Option A: Environment Variable (Recommended for Production)

Create or update `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE
```

#### Option B: Update Config File

Edit `lib/contracts/ProofRegistry.ts` and update the `contractAddress`:
```typescript
baseSepolia: {
  chainId: 84532,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  explorerUrl: "https://sepolia-explorer.base.org",
  contractAddress: "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE",
}
```

### Step 3: Verify the Contract (Optional but Recommended)

Verify your contract on Base Sepolia explorer:
1. Go to [Base Sepolia Explorer](https://sepolia-explorer.base.org/)
2. Search for your deployed contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Enter your contract code and verify

### Step 4: Test the Integration

1. Restart your Next.js development server (if using environment variables)
2. Try the onchain verification flow again
3. Check the browser console for detailed logs

## Troubleshooting

### Error: "Contract address mismatch"

**Solution**: Make sure you've set `NEXT_PUBLIC_CONTRACT_ADDRESS` to your deployed SimpleVerificationContract address, NOT the Reclaim Protocol contract address.

### Error: "Invalid provider name"

**Solution**: The proof structure might not have the provider field. Check:
- Your proof should have either `claimInfo.provider` or `claimData.provider`
- Check the browser console for the full proof structure
- The provider name should not be empty or a URL fragment

### Error: "Transaction reverted"

**Possible causes**:
1. Proof hash already exists (proof already verified)
2. Contract not deployed correctly
3. Wrong network (must be Base Sepolia, Chain ID 84532)

**Solution**: 
- Check if the proof is already verified: The contract has an `isProofVerified(bytes32)` function
- Verify your contract is deployed on Base Sepolia
- Check the transaction on the explorer to see the revert reason

## Contract Address

Once deployed, your contract address should look like: `0x...` (42 characters, starts with 0x)

Make sure to:
- ✅ Deploy to **Base Sepolia** (Chain ID: 84532)
- ✅ Set the address in environment variable or config
- ✅ Restart the dev server after changing environment variables
- ✅ Verify the contract on the explorer (optional but recommended)

## Next Steps

After deployment:
1. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with your deployed address
2. Restart your development server
3. Test the verification flow
4. Check browser console for any remaining issues

