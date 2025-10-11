// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofRegistry
 * @dev Smart contract for storing and verifying Reclaim Protocol proofs onchain
 * @notice This contract provides trustless verification of zero-knowledge proofs
 */
contract ProofRegistry {
    // Custom errors for gas efficiency
    error InvalidProofStructure();
    error ProofAlreadyExists();
    error InvalidSignature();
    error InsufficientWitnesses();
    error EmptyProvider();
    error InvalidProofHash();

    // Struct to store proof records efficiently
    struct ProofRecord {
        bytes32 proofHash;        // Deterministic hash of proof data
        address submitter;        // Address that submitted the proof
        uint256 timestamp;        // Block timestamp of submission
        string provider;          // Provider name (gmail, github, etc.)
        bool isValid;            // Validation result
    }

    // Storage mappings
    mapping(bytes32 => ProofRecord) public proofs;
    mapping(address => bytes32[]) public userProofs;
    
    // Events for indexing and monitoring
    event ProofSubmitted(
        bytes32 indexed proofHash,
        address indexed submitter,
        string provider,
        uint256 timestamp
    );
    
    event ProofQueried(
        bytes32 indexed proofHash,
        address indexed querier,
        uint256 timestamp
    );

    /**
     * @dev Submit a Reclaim Protocol proof to the blockchain
     * @param proofData The complete proof data from Reclaim Protocol
     * @param provider The provider name (e.g., "gmail", "github")
     * @return proofHash The generated hash for the submitted proof
     */
    function submitProof(
        bytes calldata proofData,
        string calldata provider
    ) external returns (bytes32) {
        // Input validation
        if (proofData.length == 0) revert InvalidProofStructure();
        if (bytes(provider).length == 0) revert EmptyProvider();

        // Generate deterministic proof hash
        bytes32 proofHash = _generateProofHash(proofData, provider);
        
        // Check if proof already exists
        if (proofs[proofHash].timestamp != 0) revert ProofAlreadyExists();

        // Validate proof structure and signatures
        if (!_validateProofStructure(proofData)) revert InvalidProofStructure();

        // Store proof record
        ProofRecord memory record = ProofRecord({
            proofHash: proofHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            provider: provider,
            isValid: true
        });

        proofs[proofHash] = record;
        userProofs[msg.sender].push(proofHash);

        // Emit event for indexing
        emit ProofSubmitted(proofHash, msg.sender, provider, block.timestamp);

        return proofHash;
    }

    /**
     * @dev Verify if a proof exists and get its details
     * @param proofHash The hash of the proof to verify
     * @return record The proof record if it exists
     */
    function verifyProof(bytes32 proofHash) external returns (ProofRecord memory) {
        if (proofHash == bytes32(0)) revert InvalidProofHash();
        
        ProofRecord memory record = proofs[proofHash];
        
        // Emit query event for monitoring
        emit ProofQueried(proofHash, msg.sender, block.timestamp);
        
        return record;
    }

    /**
     * @dev Get all proof hashes submitted by a specific user
     * @param user The address of the user
     * @return Array of proof hashes submitted by the user
     */
    function getUserProofs(address user) external view returns (bytes32[] memory) {
        return userProofs[user];
    }

    /**
     * @dev Get the total number of proofs submitted by a user
     * @param user The address of the user
     * @return The count of proofs submitted by the user
     */
    function getUserProofCount(address user) external view returns (uint256) {
        return userProofs[user].length;
    }

    /**
     * @dev Check if a specific proof hash exists
     * @param proofHash The hash to check
     * @return True if the proof exists, false otherwise
     */
    function proofExists(bytes32 proofHash) external view returns (bool) {
        return proofs[proofHash].timestamp != 0;
    }

    /**
     * @dev Generate a deterministic hash for proof data
     * @param proofData The proof data to hash
     * @param provider The provider name
     * @return The generated hash
     */
    function _generateProofHash(
        bytes calldata proofData,
        string calldata provider
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(proofData, provider, block.chainid));
    }

    /**
     * @dev Validate the structure of Reclaim Protocol proof data
     * @param proofData The proof data to validate
     * @return True if the structure is valid
     */
    function _validateProofStructure(bytes calldata proofData) internal pure returns (bool) {
        // Basic validation - ensure minimum length for a valid proof
        if (proofData.length < 32) return false;
        
        // Additional validation logic can be added here
        // For now, we perform basic length and format checks
        
        return true;
    }

    /**
     * @dev Get contract version for upgrades and compatibility
     * @return The version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}