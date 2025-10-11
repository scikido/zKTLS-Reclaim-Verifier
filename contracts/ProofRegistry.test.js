/**
 * Comprehensive Unit Tests for ProofRegistry Smart Contract
 * 
 * This test suite covers:
 * - Proof submission validation
 * - Hash generation consistency and collision resistance
 * - Access control and permission systems
 * - Event emission and data retrieval functions
 * 
 * Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ProofRegistry Contract', function () {
  let proofRegistry;
  let owner;
  let user1;
  let user2;
  let user3;

  // Test data constants
  const VALID_PROOF_DATA = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const VALID_PROVIDER = 'gmail';
  const ANOTHER_VALID_PROOF = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const ANOTHER_PROVIDER = 'github';
  const EMPTY_PROOF_DATA = '0x';
  const EMPTY_PROVIDER = '';
  const SHORT_PROOF_DATA = '0x1234567890abcdef'; // Less than 32 bytes

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy contract
    const ProofRegistry = await ethers.getContractFactory('ProofRegistry');
    proofRegistry = await ProofRegistry.deploy();
    await proofRegistry.deployed();
  });

  describe('Contract Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(proofRegistry.address).to.be.properAddress;
    });

    it('Should return correct version', async function () {
      const version = await proofRegistry.version();
      expect(version).to.equal('1.0.0');
    });
  });

  describe('Proof Submission Validation', function () {
    describe('Valid Proof Submissions', function () {
      it('Should successfully submit a valid proof', async function () {
        const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const receipt = await tx.wait();
        
        // Check transaction success
        expect(receipt.status).to.equal(1);
        
        // Verify event emission
        expect(receipt.events).to.have.lengthOf(1);
        expect(receipt.events[0].event).to.equal('ProofSubmitted');
        
        const event = receipt.events[0];
        expect(event.args.submitter).to.equal(user1.address);
        expect(event.args.provider).to.equal(VALID_PROVIDER);
        expect(event.args.timestamp).to.be.a('number');
        expect(event.args.proofHash).to.be.a('string');
      });

      it('Should allow multiple users to submit different proofs', async function () {
        // User1 submits first proof
        const tx1 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const receipt1 = await tx1.wait();
        
        // User2 submits different proof
        const tx2 = await proofRegistry.connect(user2).submitProof(ANOTHER_VALID_PROOF, ANOTHER_PROVIDER);
        const receipt2 = await tx2.wait();
        
        // Both should succeed
        expect(receipt1.status).to.equal(1);
        expect(receipt2.status).to.equal(1);
        
        // Proof hashes should be different
        const hash1 = receipt1.events[0].args.proofHash;
        const hash2 = receipt2.events[0].args.proofHash;
        expect(hash1).to.not.equal(hash2);
      });

      it('Should allow same user to submit multiple different proofs', async function () {
        // Submit first proof
        const tx1 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const receipt1 = await tx1.wait();
        
        // Submit second different proof
        const tx2 = await proofRegistry.connect(user1).submitProof(ANOTHER_VALID_PROOF, ANOTHER_PROVIDER);
        const receipt2 = await tx2.wait();
        
        // Both should succeed
        expect(receipt1.status).to.equal(1);
        expect(receipt2.status).to.equal(1);
        
        // User should have 2 proofs
        const userProofs = await proofRegistry.getUserProofs(user1.address);
        expect(userProofs).to.have.lengthOf(2);
      });
    });

    describe('Invalid Proof Submissions', function () {
      it('Should reject empty proof data', async function () {
        await expect(
          proofRegistry.connect(user1).submitProof(EMPTY_PROOF_DATA, VALID_PROVIDER)
        ).to.be.revertedWith('InvalidProofStructure');
      });

      it('Should reject empty provider', async function () {
        await expect(
          proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, EMPTY_PROVIDER)
        ).to.be.revertedWith('EmptyProvider');
      });

      it('Should reject proof data that is too short', async function () {
        await expect(
          proofRegistry.connect(user1).submitProof(SHORT_PROOF_DATA, VALID_PROVIDER)
        ).to.be.revertedWith('InvalidProofStructure');
      });

      it('Should reject duplicate proof submission', async function () {
        // Submit proof first time
        await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        
        // Try to submit same proof again
        await expect(
          proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER)
        ).to.be.revertedWith('ProofAlreadyExists');
      });

      it('Should reject duplicate proof even from different user', async function () {
        // User1 submits proof
        await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        
        // User2 tries to submit same proof
        await expect(
          proofRegistry.connect(user2).submitProof(VALID_PROOF_DATA, VALID_PROVIDER)
        ).to.be.revertedWith('ProofAlreadyExists');
      });
    });
  });

  describe('Hash Generation Consistency and Collision Resistance', function () {
    it('Should generate consistent hashes for same input', async function () {
      // Submit proof and get hash
      const tx1 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt1 = await tx1.wait();
      const hash1 = receipt1.events[0].args.proofHash;
      
      // Try to submit same proof again (should fail but we can check the hash generation)
      try {
        await proofRegistry.connect(user2).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      } catch (error) {
        // Expected to fail due to duplicate
        expect(error.message).to.include('ProofAlreadyExists');
      }
      
      // Verify the proof exists with the same hash
      const exists = await proofRegistry.proofExists(hash1);
      expect(exists).to.be.true;
    });

    it('Should generate different hashes for different proof data', async function () {
      const tx1 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt1 = await tx1.wait();
      const hash1 = receipt1.events[0].args.proofHash;
      
      const tx2 = await proofRegistry.connect(user1).submitProof(ANOTHER_VALID_PROOF, VALID_PROVIDER);
      const receipt2 = await tx2.wait();
      const hash2 = receipt2.events[0].args.proofHash;
      
      expect(hash1).to.not.equal(hash2);
    });

    it('Should generate different hashes for same data with different providers', async function () {
      const tx1 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt1 = await tx1.wait();
      const hash1 = receipt1.events[0].args.proofHash;
      
      const tx2 = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, ANOTHER_PROVIDER);
      const receipt2 = await tx2.wait();
      const hash2 = receipt2.events[0].args.proofHash;
      
      expect(hash1).to.not.equal(hash2);
    });

    it('Should generate 32-byte hashes', async function () {
      const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt = await tx.wait();
      const hash = receipt.events[0].args.proofHash;
      
      // Hash should be 32 bytes (64 hex characters + 0x prefix)
      expect(hash).to.have.lengthOf(66);
      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Access Control and Permission Systems', function () {
    it('Should allow any address to submit proofs', async function () {
      // Test multiple different addresses can submit
      await expect(
        proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER)
      ).to.not.be.reverted;
      
      await expect(
        proofRegistry.connect(user2).submitProof(ANOTHER_VALID_PROOF, ANOTHER_PROVIDER)
      ).to.not.be.reverted;
      
      await expect(
        proofRegistry.connect(owner).submitProof(
          '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
          'twitter'
        )
      ).to.not.be.reverted;
    });

    it('Should correctly track proof submitter', async function () {
      const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt = await tx.wait();
      const proofHash = receipt.events[0].args.proofHash;
      
      const proofRecord = await proofRegistry.verifyProof(proofHash);
      expect(proofRecord.submitter).to.equal(user1.address);
    });

    it('Should allow any address to verify proofs', async function () {
      // User1 submits proof
      const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt = await tx.wait();
      const proofHash = receipt.events[0].args.proofHash;
      
      // Different users should be able to verify
      await expect(
        proofRegistry.connect(user2).verifyProof(proofHash)
      ).to.not.be.reverted;
      
      await expect(
        proofRegistry.connect(user3).verifyProof(proofHash)
      ).to.not.be.reverted;
      
      await expect(
        proofRegistry.connect(owner).verifyProof(proofHash)
      ).to.not.be.reverted;
    });

    it('Should allow any address to query user proofs', async function () {
      // User1 submits proof
      await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      
      // Different users should be able to query
      await expect(
        proofRegistry.connect(user2).getUserProofs(user1.address)
      ).to.not.be.reverted;
      
      await expect(
        proofRegistry.connect(user3).getUserProofCount(user1.address)
      ).to.not.be.reverted;
    });
  });

  describe('Event Emission and Data Retrieval Functions', function () {
    describe('ProofSubmitted Event', function () {
      it('Should emit ProofSubmitted event with correct parameters', async function () {
        const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const receipt = await tx.wait();
        
        expect(receipt.events).to.have.lengthOf(1);
        const event = receipt.events[0];
        
        expect(event.event).to.equal('ProofSubmitted');
        expect(event.args.submitter).to.equal(user1.address);
        expect(event.args.provider).to.equal(VALID_PROVIDER);
        expect(event.args.proofHash).to.be.a('string');
        expect(event.args.timestamp).to.be.a('number');
        
        // Timestamp should be recent (within last minute)
        const currentTime = Math.floor(Date.now() / 1000);
        expect(event.args.timestamp).to.be.closeTo(currentTime, 60);
      });

      it('Should emit indexed parameters for efficient filtering', async function () {
        const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const receipt = await tx.wait();
        
        const event = receipt.events[0];
        
        // Check that proofHash and submitter are indexed (should be in topics)
        expect(receipt.logs[0].topics).to.have.lengthOf(3); // event signature + 2 indexed params
      });
    });

    describe('ProofQueried Event', function () {
      it('Should emit ProofQueried event when verifying proof', async function () {
        // Submit proof first
        const submitTx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        const submitReceipt = await submitTx.wait();
        const proofHash = submitReceipt.events[0].args.proofHash;
        
        // Verify proof and check event
        const verifyTx = await proofRegistry.connect(user2).verifyProof(proofHash);
        const verifyReceipt = await verifyTx.wait();
        
        expect(verifyReceipt.events).to.have.lengthOf(1);
        const event = verifyReceipt.events[0];
        
        expect(event.event).to.equal('ProofQueried');
        expect(event.args.proofHash).to.equal(proofHash);
        expect(event.args.querier).to.equal(user2.address);
        expect(event.args.timestamp).to.be.a('number');
      });
    });

    describe('Data Retrieval Functions', function () {
      beforeEach(async function () {
        // Submit test proofs
        await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
        await proofRegistry.connect(user1).submitProof(ANOTHER_VALID_PROOF, ANOTHER_PROVIDER);
        await proofRegistry.connect(user2).submitProof(
          '0xfeedbeeffeedbeeffeedbeeffeedbeeffeedbeeffeedbeeffeedbeeffeedbeef',
          'twitter'
        );
      });

      it('Should return correct proof record when verifying', async function () {
        const tx = await proofRegistry.connect(user1).submitProof(
          '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
          'linkedin'
        );
        const receipt = await tx.wait();
        const proofHash = receipt.events[0].args.proofHash;
        
        const proofRecord = await proofRegistry.verifyProof(proofHash);
        
        expect(proofRecord.proofHash).to.equal(proofHash);
        expect(proofRecord.submitter).to.equal(user1.address);
        expect(proofRecord.provider).to.equal('linkedin');
        expect(proofRecord.isValid).to.be.true;
        expect(proofRecord.timestamp).to.be.a('number');
      });

      it('Should return empty record for non-existent proof', async function () {
        const nonExistentHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
        const proofRecord = await proofRegistry.verifyProof(nonExistentHash);
        
        expect(proofRecord.proofHash).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(proofRecord.submitter).to.equal('0x0000000000000000000000000000000000000000');
        expect(proofRecord.provider).to.equal('');
        expect(proofRecord.isValid).to.be.false;
        expect(proofRecord.timestamp).to.equal(0);
      });

      it('Should return correct user proofs', async function () {
        const user1Proofs = await proofRegistry.getUserProofs(user1.address);
        const user2Proofs = await proofRegistry.getUserProofs(user2.address);
        
        expect(user1Proofs).to.have.lengthOf(2);
        expect(user2Proofs).to.have.lengthOf(1);
        
        // Each proof hash should be valid
        for (const proofHash of user1Proofs) {
          expect(proofHash).to.match(/^0x[a-fA-F0-9]{64}$/);
        }
      });

      it('Should return correct user proof count', async function () {
        const user1Count = await proofRegistry.getUserProofCount(user1.address);
        const user2Count = await proofRegistry.getUserProofCount(user2.address);
        const user3Count = await proofRegistry.getUserProofCount(user3.address);
        
        expect(user1Count).to.equal(2);
        expect(user2Count).to.equal(1);
        expect(user3Count).to.equal(0);
      });

      it('Should correctly check proof existence', async function () {
        const user1Proofs = await proofRegistry.getUserProofs(user1.address);
        const existingHash = user1Proofs[0];
        const nonExistentHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
        
        const exists = await proofRegistry.proofExists(existingHash);
        const notExists = await proofRegistry.proofExists(nonExistentHash);
        
        expect(exists).to.be.true;
        expect(notExists).to.be.false;
      });

      it('Should handle invalid proof hash in verifyProof', async function () {
        const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
        
        await expect(
          proofRegistry.verifyProof(zeroHash)
        ).to.be.revertedWith('InvalidProofHash');
      });
    });
  });

  describe('Gas Usage and Optimization', function () {
    it('Should use reasonable gas for proof submission', async function () {
      const tx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (less than 200k gas)
      expect(receipt.gasUsed.toNumber()).to.be.lessThan(200000);
      expect(receipt.gasUsed.toNumber()).to.be.greaterThan(50000);
    });

    it('Should use minimal gas for proof verification', async function () {
      // Submit proof first
      const submitTx = await proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, VALID_PROVIDER);
      const submitReceipt = await submitTx.wait();
      const proofHash = submitReceipt.events[0].args.proofHash;
      
      // Verify proof
      const verifyTx = await proofRegistry.connect(user2).verifyProof(proofHash);
      const verifyReceipt = await verifyTx.wait();
      
      // Verification should use less gas than submission
      expect(verifyReceipt.gasUsed.toNumber()).to.be.lessThan(100000);
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle maximum length provider names', async function () {
      const longProvider = 'a'.repeat(100); // Very long provider name
      
      await expect(
        proofRegistry.connect(user1).submitProof(VALID_PROOF_DATA, longProvider)
      ).to.not.be.reverted;
    });

    it('Should handle large proof data', async function () {
      const largeProofData = '0x' + '1234567890abcdef'.repeat(100); // Large proof data
      
      await expect(
        proofRegistry.connect(user1).submitProof(largeProofData, VALID_PROVIDER)
      ).to.not.be.reverted;
    });

    it('Should maintain state consistency across multiple operations', async function () {
      // Submit multiple proofs
      const proofs = [];
      for (let i = 0; i < 5; i++) {
        const proofData = '0x' + i.toString().padStart(64, '0');
        const tx = await proofRegistry.connect(user1).submitProof(proofData, `provider${i}`);
        const receipt = await tx.wait();
        proofs.push(receipt.events[0].args.proofHash);
      }
      
      // Verify all proofs exist
      for (const proofHash of proofs) {
        const exists = await proofRegistry.proofExists(proofHash);
        expect(exists).to.be.true;
      }
      
      // Check user proof count
      const count = await proofRegistry.getUserProofCount(user1.address);
      expect(count).to.equal(5);
      
      // Check user proofs array
      const userProofs = await proofRegistry.getUserProofs(user1.address);
      expect(userProofs).to.have.lengthOf(5);
    });
  });
});