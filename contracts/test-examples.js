/**
 * Example test cases for ProofRegistry contract
 * These examples can be used with testing frameworks like Hardhat or Foundry
 */

// Example proof data for testing
const EXAMPLE_PROOF_DATA = {
  valid: {
    proofData: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    provider: "gmail"
  },
  invalid: {
    proofData: "0x",
    provider: ""
  }
};

// Example test scenarios
const TEST_SCENARIOS = {
  // Test successful proof submission
  submitValidProof: {
    description: "Should successfully submit a valid proof",
    input: EXAMPLE_PROOF_DATA.valid,
    expectedEvents: ["ProofSubmitted"],
    expectedResult: "success"
  },

  // Test duplicate proof rejection
  submitDuplicateProof: {
    description: "Should reject duplicate proof submission",
    input: EXAMPLE_PROOF_DATA.valid,
    expectedError: "ProofAlreadyExists",
    expectedResult: "revert"
  },

  // Test invalid proof data
  submitInvalidProof: {
    description: "Should reject invalid proof data",
    input: EXAMPLE_PROOF_DATA.invalid,
    expectedError: "InvalidProofStructure",
    expectedResult: "revert"
  },

  // Test proof verification
  verifyExistingProof: {
    description: "Should return proof details for existing proof",
    expectedEvents: ["ProofQueried"],
    expectedResult: "success"
  },

  // Test user proof retrieval
  getUserProofs: {
    description: "Should return all proofs submitted by user",
    expectedResult: "array"
  },

  // Test proof existence check
  checkProofExists: {
    description: "Should return true for existing proof",
    expectedResult: true
  }
};

// Gas usage expectations
const GAS_EXPECTATIONS = {
  submitProof: { min: 100000, max: 200000 },
  verifyProof: { min: 30000, max: 70000 },
  getUserProofs: { min: 20000, max: 50000 },
  proofExists: { min: 15000, max: 35000 }
};

// Example Hardhat test structure
const HARDHAT_TEST_EXAMPLE = `
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProofRegistry", function () {
  let proofRegistry;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
    proofRegistry = await ProofRegistry.deploy();
    await proofRegistry.deployed();
  });

  describe("Proof Submission", function () {
    it("Should submit a valid proof", async function () {
      const proofData = "${EXAMPLE_PROOF_DATA.valid.proofData}";
      const provider = "${EXAMPLE_PROOF_DATA.valid.provider}";
      
      const tx = await proofRegistry.connect(user1).submitProof(proofData, provider);
      const receipt = await tx.wait();
      
      expect(receipt.events).to.have.lengthOf(1);
      expect(receipt.events[0].event).to.equal("ProofSubmitted");
    });

    it("Should reject duplicate proof", async function () {
      const proofData = "${EXAMPLE_PROOF_DATA.valid.proofData}";
      const provider = "${EXAMPLE_PROOF_DATA.valid.provider}";
      
      await proofRegistry.connect(user1).submitProof(proofData, provider);
      
      await expect(
        proofRegistry.connect(user1).submitProof(proofData, provider)
      ).to.be.revertedWith("ProofAlreadyExists");
    });
  });

  describe("Proof Verification", function () {
    it("Should verify existing proof", async function () {
      const proofData = "${EXAMPLE_PROOF_DATA.valid.proofData}";
      const provider = "${EXAMPLE_PROOF_DATA.valid.provider}";
      
      const tx = await proofRegistry.connect(user1).submitProof(proofData, provider);
      const receipt = await tx.wait();
      const proofHash = receipt.events[0].args.proofHash;
      
      const proofRecord = await proofRegistry.verifyProof(proofHash);
      expect(proofRecord.isValid).to.be.true;
      expect(proofRecord.provider).to.equal(provider);
    });
  });
});
`;

module.exports = {
  EXAMPLE_PROOF_DATA,
  TEST_SCENARIOS,
  GAS_EXPECTATIONS,
  HARDHAT_TEST_EXAMPLE
};