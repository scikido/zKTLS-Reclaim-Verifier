#!/usr/bin/env node

/**
 * Test syntax verification script
 * Validates that the test file has correct JavaScript syntax and structure
 */

const fs = require('fs');
const path = require('path');

function verifyTestSyntax() {
  console.log('Verifying test file syntax...\n');
  
  try {
    // Read the test file
    const testFilePath = path.join(__dirname, 'ProofRegistry.test.js');
    const testContent = fs.readFileSync(testFilePath, 'utf8');
    
    // Basic syntax validation
    console.log('✓ Test file exists and is readable');
    
    // Check for required test framework imports
    if (!testContent.includes("require('chai')") && !testContent.includes("require('hardhat')")) {
      console.log('⚠️  Warning: Test framework imports not found (expected for Hardhat setup)');
    } else {
      console.log('✓ Test framework imports found');
    }
    
    // Check for describe blocks
    const describeBlocks = testContent.match(/describe\(/g);
    if (!describeBlocks || describeBlocks.length < 5) {
      throw new Error('Insufficient describe blocks found');
    }
    console.log(`✓ Found ${describeBlocks.length} describe blocks`);
    
    // Check for it blocks
    const itBlocks = testContent.match(/it\(/g);
    if (!itBlocks || itBlocks.length < 20) {
      throw new Error('Insufficient test cases found');
    }
    console.log(`✓ Found ${itBlocks.length} test cases`);
    
    // Check for expect statements
    const expectStatements = testContent.match(/expect\(/g);
    if (!expectStatements || expectStatements.length < 30) {
      throw new Error('Insufficient expect statements found');
    }
    console.log(`✓ Found ${expectStatements.length} expect statements`);
    
    // Check for async/await usage
    const asyncFunctions = testContent.match(/async function/g);
    if (!asyncFunctions || asyncFunctions.length < 10) {
      console.log('⚠️  Warning: Limited async function usage detected');
    } else {
      console.log(`✓ Found ${asyncFunctions.length} async functions`);
    }
    
    // Check for contract interaction patterns
    const contractCalls = testContent.match(/proofRegistry\./g);
    if (!contractCalls || contractCalls.length < 20) {
      throw new Error('Insufficient contract interaction calls found');
    }
    console.log(`✓ Found ${contractCalls.length} contract interaction calls`);
    
    // Check for event testing
    if (!testContent.includes('ProofSubmitted') || !testContent.includes('ProofQueried')) {
      throw new Error('Missing event testing');
    }
    console.log('✓ Event testing found');
    
    // Check for error testing
    if (!testContent.includes('revertedWith') && !testContent.includes('reverted')) {
      throw new Error('Missing error condition testing');
    }
    console.log('✓ Error condition testing found');
    
    // Try to parse as JavaScript (basic syntax check)
    try {
      // This won't execute but will catch syntax errors
      new Function(testContent);
      console.log('✓ JavaScript syntax validation passed');
    } catch (syntaxError) {
      throw new Error(`JavaScript syntax error: ${syntaxError.message}`);
    }
    
    console.log('\n🎉 Test file syntax verification completed successfully!');
    console.log('\nTest file statistics:');
    console.log(`- Lines of code: ${testContent.split('\n').length}`);
    console.log(`- Test suites: ${describeBlocks.length}`);
    console.log(`- Test cases: ${itBlocks.length}`);
    console.log(`- Assertions: ${expectStatements.length}`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test syntax verification failed:', error.message);
    return false;
  }
}

// Run verification if called directly
if (require.main === module) {
  const success = verifyTestSyntax();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyTestSyntax };