# ProofRegistry Smart Contract

## Overview

The ProofRegistry smart contract enables onchain verification of Reclaim Protocol proofs. It provides a trustless, decentralized way to store and verify zero-knowledge proofs on the blockchain while maintaining privacy.

## Features

- **Proof Storage**: Store deterministic hashes of Reclaim Protocol proofs
- **Validation**: Validate proof structure and prevent duplicates
- **User Management**: Track proofs submitted by each user
- **Event Emission**: Emit events for indexing and monitoring
- **Gas Optimization**: Efficient storage and operations
- **Error Handling**: Comprehensive error messages and validation

## Contract Functions

### Core Functions

#### `submitProof(bytes proofData, string provider) → bytes32`
Submits a Reclaim Protocol proof to the blockchain.
- **Parameters**:
  - `proofData`: Complete proof data from Reclaim Protocol
  - `provider`: Provider name (e.g., "gmail", "github")
- **Returns**: Generated proof hash
- **Events**: Emits `ProofSubmitted` event

#### `verifyProof(bytes32 proofHash) → ProofRecord`
Verifies if a proof exists and returns its details.
- **Parameters**:
  - `proofHash`: Hash of the proof to verify
- **Returns**: ProofRecord struct with proof details
- **Events**: Emits `ProofQueried` event

#### `getUserProofs(address user) → bytes32[]`
Gets all proof hashes submitted by a specific user.
- **Parameters**:
  - `user`: Address of the user
- **Returns**: Array of proof hashes

### Utility Functions

#### `proofExists(bytes32 proofHash) → bool`
Checks if a specific proof hash exists.

#### `getUserProofCount(address user) → uint256`
Gets the total number of proofs submitted by a user.

#### `version() → string`
Returns the contract version.

## Data Structures

### ProofRecord
```solidity
struct ProofRecord {
    bytes32 proofHash;    // Deterministic hash of proof data
    address submitter;    // Address that submitted the proof
    uint256 timestamp;    // Block timestamp of submission
    string provider;      // Provider name
    bool isValid;        // Validation result
}
```

## Events

### ProofSubmitted
```solidity
event ProofSubmitted(
    bytes32 indexed proofHash,
    address indexed submitter,
    string provider,
    uint256 timestamp
);
```

### ProofQueried
```solidity
event ProofQueried(
    bytes32 indexed proofHash,
    address indexed querier,
    uint256 timestamp
);
```

## Error Handling

The contract uses custom errors for gas efficiency:

- `InvalidProofStructure()`: Proof data is invalid or malformed
- `ProofAlreadyExists()`: Proof hash already exists in storage
- `InvalidSignature()`: Proof signature validation failed
- `InsufficientWitnesses()`: Not enough witnesses for proof validation
- `EmptyProvider()`: Provider name is empty
- `InvalidProofHash()`: Proof hash is invalid (zero hash)

## Deployment Instructions

### Using Remix IDE (Recommended)

1. **Open Remix IDE**: Go to https://remix.ethereum.org
2. **Create Contract File**: Create `contracts/ProofRegistry.sol`
3. **Copy Contract Code**: Paste the ProofRegistry contract code
4. **Compile Contract**: 
   - Select Solidity compiler version 0.8.19 or higher
   - Compile the contract
5. **Connect Wallet**: Connect MetaMask to Sepolia testnet
6. **Deploy Contract**:
   - Go to Deploy & Run tab
   - Select "Injected Provider - MetaMask"
   - Deploy the ProofRegistry contract
7. **Verify Contract**: Copy contract address and verify on Etherscan
8. **Update Frontend**: Add contract address to environment variables

### Environment Variables

After deployment, add these variables to your `.env.local`:

```env
# Smart Contract Configuration
NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS=0x... # Your deployed contract address
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
```

## Gas Optimization

The contract implements several gas optimization strategies:

1. **Packed Structs**: Efficient storage layout
2. **Custom Errors**: Gas-efficient error handling
3. **Hash Storage**: Store only hashes, not full proof data
4. **Batch Operations**: Support for multiple operations
5. **View Functions**: Read operations don't consume gas

## Security Features

1. **Input Validation**: Comprehensive validation of all inputs
2. **Duplicate Prevention**: Prevents duplicate proof submissions
3. **Access Control**: Proper access control for sensitive operations
4. **Reentrancy Protection**: Safe external calls
5. **Integer Overflow Protection**: Built-in Solidity 0.8+ protection

## Testing

The contract should be thoroughly tested before mainnet deployment:

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test complete workflows
3. **Gas Analysis**: Optimize gas usage
4. **Security Audit**: Professional security review

## Mainnet Deployment

For production deployment:

1. **Audit**: Complete security audit
2. **Testnet Testing**: Extensive testing on Sepolia
3. **Gas Optimization**: Final gas optimizations
4. **Deployment**: Deploy to Ethereum mainnet or Base
5. **Verification**: Verify contract on block explorer
6. **Monitoring**: Set up monitoring and alerts

## Contract Verification

After deployment, verify the contract on Etherscan:

1. Go to the contract address on Etherscan
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Select "Solidity (Single file)"
5. Enter compiler version (0.8.19+)
6. Paste the contract source code
7. Submit for verification

## Support

For issues or questions:
- Check the contract events for debugging
- Use Sepolia testnet for testing
- Refer to Remix IDE documentation
- Check Etherscan for transaction details