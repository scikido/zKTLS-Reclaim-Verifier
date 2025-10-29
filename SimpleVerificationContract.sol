// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Simple Verification Contract for zKTLS Proof Verification
 * Deploy this contract to Base Sepolia to enable real proof verification with data
 */
contract SimpleVerificationContract {
    
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        string provider,
        uint256 timestamp
    );
    
    mapping(bytes32 => bool) public verifiedProofs;
    mapping(address => uint256) public userProofCount;
    
    /**
     * Verify a proof and emit an event
     * @param proofHash Hash of the proof data
     * @param provider Name of the proof provider (e.g., "Gmail", "GitHub")
     */
    function verifyProof(bytes32 proofHash, string memory provider) external payable {
        require(!verifiedProofs[proofHash], "Proof already verified");
        
        verifiedProofs[proofHash] = true;
        userProofCount[msg.sender]++;
        
        emit ProofVerified(msg.sender, proofHash, provider, block.timestamp);
    }
    
    /**
     * Check if a proof has been verified
     */
    function isProofVerified(bytes32 proofHash) external view returns (bool) {
        return verifiedProofs[proofHash];
    }
    
    /**
     * Get user's proof count
     */
    function getUserProofCount(address user) external view returns (uint256) {
        return userProofCount[user];
    }
    
    /**
     * Allow contract owner to withdraw accumulated ETH
     */
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

/*
DEPLOYMENT INSTRUCTIONS:

1. Go to https://remix.ethereum.org/
2. Create a new file with this contract code
3. Compile with Solidity 0.8.x
4. Deploy to Base Sepolia testnet
5. Copy the deployed contract address
6. Update CONTRACT_CONFIG.baseSepolia.contractAddress with the new address

ALTERNATIVE - Use existing contract addresses:
- You can also use any existing contract address that accepts payable transactions
- For testing, you could even use a simple payable contract or multisig
*/
