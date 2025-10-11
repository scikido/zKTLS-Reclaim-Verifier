# ProofRegistry Smart Contract Tests

This directory contains comprehensive unit tests for the ProofRegistry smart contract, covering all requirements specified in the onchain proof verification feature specification.

## Test Coverage

### Requirements Covered
- **3.1**: Smart contract validates proof structure and signatures
- **3.2**: Contract stores proof hash with metadata  
- **3.3**: Contract emits events for proof submissions
- **3.4**: Contract returns verification status and timestamp
- **3.5**: Contract reverts with appropriate errors for invalid proofs

### Test Categories

#### 1. Proof Submission Validation
- ✅ Valid proof submissions
- ✅ Invalid proof data rejection
- ✅ Empty provider rejection
- ✅ Duplicate proof prevention
- ✅ Multiple user support

#### 2. Hash Generation Consistency and Collision Resistance
- ✅ Consistent hash generation for same inputs
- ✅ Different hashes for different proof data
- ✅ Different hashes for different providers
- ✅ Proper 32-byte hash format
- ✅ Collision resistance validation

#### 3. Access Control and Permission Systems
- ✅ Open proof submission (any address can submit)
- ✅ Correct submitter tracking
- ✅ Open proof verification (any address can verify)
- ✅ Open query access (any address can query)

#### 4. Event Emission and Data Retrieval Functions
- ✅ ProofSubmitted event with correct parameters
- ✅ ProofQueried event emission
- ✅ Indexed parameters for efficient filtering
- ✅ Correct proof record retrieval
- ✅ User proof management
- ✅ Proof existence checking

### Additional Test Coverage
- ✅ Gas usage optimization
- ✅ Edge cases and error handling
- ✅ State consistency across operations
- ✅ Large data handling
- ✅ Maximum length inputs

## Test Files

### `ProofRegistry.test.js`
Comprehensive test suite using Hardhat and Chai testing framework. Contains:
- 50+ individual test cases
- Complete function coverage
- Error condition testing
- Event emission validation
- Gas usage verification

### `test-runner.js`
Validation script that checks:
- Test structure completeness
- Requirements coverage
- Contract interface coverage
- Test case presence

### Configuration Files
- `package.json`: Testing dependencies and scripts
- `hardhat.config.js`: Hardhat configuration for testing
- `TEST_README.md`: This documentation file

## Running Tests

### Prerequisites
```bash
cd contracts
npm install
```

### Test Commands

#### Run All Tests
```bash
npm test
```

#### Run Tests with Gas Reporting
```bash
npm run test:gas
```

#### Run Test Validation
```bash
node test-runner.js
```

#### Run Specific Test Categories
```bash
# Run only proof submission tests
npx hardhat test --grep "Proof Submission Validation"

# Run only hash generation tests
npx hardhat test --grep "Hash Generation"

# Run only access control tests
npx hardhat test --grep "Access Control"

# Run only event emission tests
npx hardhat test --grep "Event Emission"
```

### Coverage Report
```bash
npx hardhat coverage
```

## Test Data

### Valid Test Data
- `VALID_PROOF_DATA`: 64-byte hex string representing valid proof
- `VALID_PROVIDER`: "gmail" - standard provider name
- `ANOTHER_VALID_PROOF`: Different valid proof for collision testing
- `ANOTHER_PROVIDER`: "github" - alternative provider

### Invalid Test Data
- `EMPTY_PROOF_DATA`: Empty hex string
- `EMPTY_PROVIDER`: Empty string
- `SHORT_PROOF_DATA`: Less than 32 bytes

## Expected Test Results

### Gas Usage Expectations
- Proof submission: 50,000 - 200,000 gas
- Proof verification: < 100,000 gas
- User proof queries: < 50,000 gas

### Event Emission
- ProofSubmitted: Emitted on successful submission
- ProofQueried: Emitted on proof verification

### Error Conditions
- `InvalidProofStructure`: Empty or too short proof data
- `ProofAlreadyExists`: Duplicate proof submission
- `EmptyProvider`: Empty provider string
- `InvalidProofHash`: Zero hash in verification

## Integration with CI/CD

The tests are designed to be run in continuous integration environments:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: cd contracts && npm install

- name: Run contract tests
  run: cd contracts && npm test

- name: Generate coverage report
  run: cd contracts && npx hardhat coverage
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'hardhat'"**
   - Solution: Run `npm install` in the contracts directory

2. **"Network connection error"**
   - Solution: Tests run on local Hardhat network, no external connection needed

3. **"Gas estimation failed"**
   - Solution: Check contract compilation with `npx hardhat compile`

### Debug Mode
Run tests with verbose output:
```bash
npx hardhat test --verbose
```

## Test Maintenance

When updating the ProofRegistry contract:
1. Update corresponding test cases
2. Run `node test-runner.js` to validate coverage
3. Update gas expectations if needed
4. Add new test cases for new functionality

## Security Testing

The test suite includes security-focused tests:
- Input validation
- Access control verification
- State consistency checks
- Gas optimization validation
- Edge case handling

These tests help ensure the contract is secure and efficient for production deployment.