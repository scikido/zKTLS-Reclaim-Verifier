# zKTLS Onchain Verification Setup Guide

## Overview

The zKTLS project now supports onchain proof verification using Reclaim Protocol's zkFetch library and smart contracts deployed on Base Sepolia network. This guide explains the complete flow and setup requirements.

## User Flow

1. **Select Provider**: User visits the homepage and selects a provider (Gmail, GitHub, Twitter, etc.)
2. **Generate Proof**: The system generates a zero-knowledge proof of the user's account ownership
3. **View Proof**: After successful generation, user sees the proof data and a "Verify Onchain" button
4. **Connect Wallet**: User clicks "Verify Onchain" and connects their Web3 wallet (MetaMask, etc.)
5. **Switch Network**: The app automatically prompts to switch to Base Sepolia network if needed
6. **Submit Transaction**: The proof is submitted to the blockchain for permanent verification
7. **View Transaction**: User can view the transaction on Base Sepolia explorer

## Technical Implementation

### Backend Components

1. **Onchain Verification Service** (`lib/services/onchainVerification.ts`):
   - Uses `@reclaimprotocol/zk-fetch` for proof generation
   - Uses `ethers@5.7` for blockchain interactions
   - Transforms proofs using `@reclaimprotocol/js-sdk` for onchain submission

2. **API Endpoints**:
   - `/api/generate-proof`: Generates zero-knowledge proofs using zkFetch
   - `/api/verify-onchain`: Submits proofs to the blockchain

3. **Smart Contract Integration**:
   - Contract Address: `0xF90085f5Fd1a3bEb8678623409b3811eCeC5f6A5`
   - Network: Base Sepolia (Chain ID: 84532)
   - RPC URL: `https://sepolia.base.org`

### Frontend Components

1. **OnchainVerification Component** (`components/OnchainVerification.tsx`):
   - Handles wallet connection
   - Manages network switching to Base Sepolia
   - Submits proofs to the blockchain
   - Shows transaction status and explorer links

2. **Main Page Integration** (`app/page.tsx`):
   - Shows "Verify Onchain" button after proof generation
   - Toggles the OnchainVerification component visibility

## Environment Configuration

Create a `.env.local` file in the zKTLS directory with the following variables:

```env
# Reclaim Protocol Configuration
APP_ID=0xe881BF2db8D9ef63cF268D1e15A810175C1522e0
APP_SECRET=0x67458f2d3951e98a877b802cba2c9102a1ea3d7f504d7f91cbc2984355826fed

# Blockchain Configuration
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your-private-key-here
CONTRACT_ADDRESS=0xF90085f5Fd1a3bEb8678623409b3811eCeC5f6A5

# Next.js Public Variables
NEXT_PUBLIC_RECLAIM_APP_ID=0xe881BF2db8D9ef63cF268D1e15A810175C1522e0
NEXT_PUBLIC_RECLAIM_APP_SECRET=0x67458f2d3951e98a877b802cba2c9102a1ea3d7f504d7f91cbc2984355826fed
```

**Important**: Replace `your-private-key-here` with an actual Ethereum private key that has Base Sepolia ETH for gas fees.

## Getting Base Sepolia ETH

To submit transactions on Base Sepolia, you need test ETH:

1. Visit the [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Connect your wallet
3. Request test ETH
4. Wait for the transaction to complete

## Running the Application

1. Install dependencies:
   ```bash
   cd zKTLS
   npm install
   ```

2. Create the `.env.local` file with your configuration

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Testing the Flow

1. Select any provider (e.g., Gmail)
2. Complete the verification process
3. Once proof is generated, click "Verify Onchain"
4. Connect your wallet when prompted
5. Approve the network switch to Base Sepolia
6. Confirm the transaction
7. View the transaction on the explorer

## Troubleshooting

### Common Issues

1. **"No Web3 wallet detected"**: Install MetaMask or another Web3 wallet
2. **"Insufficient funds"**: Get Base Sepolia ETH from the faucet
3. **"Failed to switch network"**: Manually add Base Sepolia to your wallet:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Explorer: https://sepolia-explorer.base.org

4. **"Private key required"**: Ensure PRIVATE_KEY is set in `.env.local`

### Network Configuration

The app automatically configures Base Sepolia in the user's wallet, but if needed, here are the manual settings:

- **Chain ID**: 84532 (0x14a34 in hex)
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia-explorer.base.org
- **Currency**: ETH (18 decimals)

## Security Considerations

1. **Private Key**: The server-side private key in `.env.local` is used for submitting proofs. In production, use a secure key management service.
2. **Gas Fees**: Monitor gas usage and maintain sufficient balance
3. **Rate Limiting**: Consider implementing rate limiting for the API endpoints

## Next Steps

- Deploy to production with proper environment variables
- Set up monitoring for the onchain verification service
- Implement additional providers for proof generation
- Add support for other blockchain networks
