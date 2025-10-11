# Requirements Document

## Introduction

This feature will extend the ZK Identity Vault to support onchain verification of Reclaim Protocol proofs. Users will be able to submit their zero-knowledge proofs to a smart contract for permanent, trustless verification on the blockchain. This creates an immutable record of verified credentials while maintaining privacy through zero-knowledge cryptography.

## Requirements

### Requirement 1

**User Story:** As a user with a verified Reclaim proof, I want to submit my proof to a blockchain smart contract, so that I can have an immutable, trustless record of my verified credential.

#### Acceptance Criteria

1. WHEN a user has a valid Reclaim proof THEN the system SHALL provide an option to "Verify Onchain"
2. WHEN a user clicks "Verify Onchain" THEN the system SHALL connect to their Web3 wallet
3. WHEN the wallet is connected THEN the system SHALL submit the proof data to a smart contract
4. WHEN the transaction is successful THEN the system SHALL display the transaction hash and confirmation
5. IF the user doesn't have a Web3 wallet THEN the system SHALL provide instructions to install one

### Requirement 2

**User Story:** As a user, I want to verify that a proof has been submitted onchain, so that I can trust its authenticity without relying on centralized verification.

#### Acceptance Criteria

1. WHEN a user provides a transaction hash or proof identifier THEN the system SHALL query the blockchain to verify the proof exists
2. WHEN a proof exists onchain THEN the system SHALL display the verification status, timestamp, and proof details
3. WHEN a proof doesn't exist onchain THEN the system SHALL clearly indicate it has not been verified onchain
4. WHEN displaying onchain verification results THEN the system SHALL show the block number, transaction hash, and verification timestamp

### Requirement 3

**User Story:** As a developer, I want a smart contract that can store and verify Reclaim Protocol proofs, so that the verification process is trustless and decentralized.

#### Acceptance Criteria

1. WHEN a proof is submitted to the smart contract THEN the contract SHALL validate the proof structure and signatures
2. WHEN a valid proof is submitted THEN the contract SHALL store a hash of the proof with metadata
3. WHEN storing a proof THEN the contract SHALL emit an event with the proof hash and submitter address
4. WHEN querying a proof THEN the contract SHALL return verification status and timestamp
5. IF an invalid proof is submitted THEN the contract SHALL revert the transaction with an appropriate error message

### Requirement 4

**User Story:** As a user, I want to see all my onchain verified proofs in one place, so that I can manage my verified credentials efficiently.

#### Acceptance Criteria

1. WHEN a user connects their wallet THEN the system SHALL display all proofs they have submitted onchain
2. WHEN displaying onchain proofs THEN the system SHALL show the provider, verification date, and transaction details
3. WHEN a user clicks on an onchain proof THEN the system SHALL show detailed verification information
4. WHEN no onchain proofs exist for a wallet THEN the system SHALL display an appropriate empty state

### Requirement 5

**User Story:** As a user, I want to share my onchain verification status with others, so that they can independently verify my credentials.

#### Acceptance Criteria

1. WHEN a proof is verified onchain THEN the system SHALL generate a shareable verification link
2. WHEN someone visits a verification link THEN they SHALL see the onchain verification status without needing to connect a wallet
3. WHEN displaying shared verification THEN the system SHALL show the proof details, blockchain confirmation, and verification timestamp
4. IF a shared verification link is for a non-existent proof THEN the system SHALL display an appropriate error message