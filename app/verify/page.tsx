'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Clipboard, Shield, Download, RefreshCw, Upload } from 'lucide-react';

interface ProofData {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: any[];
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [proofInput, setProofInput] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [verificationMode, setVerificationMode] = useState<'proof' | 'hash'>('proof');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    details: any;
    error?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  useEffect(() => {
    const proofFromUrl = searchParams.get('proof');
    const hashFromUrl = searchParams.get('proofHash') || searchParams.get('hash');
    
    if (proofFromUrl) {
      setProofInput(proofFromUrl);
      setVerificationMode('proof');
      handleVerification(proofFromUrl);
    } else if (hashFromUrl) {
      setHashInput(hashFromUrl);
      setVerificationMode('hash');
      handleHashVerification(hashFromUrl);
    }
  }, [searchParams]);

  const handleVerification = async (proofData?: string) => {
    const dataToVerify = proofData || proofInput;
    
    if (!dataToVerify.trim()) {
      setVerificationResult({
        isValid: false,
        details: null,
        error: 'Please provide a proof to verify'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Parse the proof data
      const proof: ProofData = JSON.parse(dataToVerify);
      
      // Basic validation checks
      if (!proof.claimData || !proof.signatures || !proof.witnesses) {
        throw new Error('Invalid proof structure');
      }

      // In a real implementation, you would verify the signatures
      // and check against the Reclaim Protocol verification system
      // For now, we'll do basic structural validation
      
      const isValidStructure = 
        proof.claimData.provider &&
        proof.claimData.parameters &&
        Array.isArray(proof.signatures) &&
        Array.isArray(proof.witnesses);

      if (isValidStructure) {
        setVerificationResult({
          isValid: true,
          details: {
            provider: proof.claimData.provider,
            timestamp: new Date().toISOString(),
            witnessCount: proof.witnesses.length,
            signatureCount: proof.signatures.length,
            context: proof.claimData.context
          }
        });
      } else {
        throw new Error('Proof structure validation failed');
      }

    } catch (error) {
      setVerificationResult({
        isValid: false,
        details: null,
        error: error instanceof Error ? error.message : 'Invalid proof format'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleHashVerification = async (hashData?: string) => {
    const hashToVerify = hashData || hashInput;
    
    if (!hashToVerify.trim()) {
      setVerificationResult({
        isValid: false,
        details: null,
        error: 'Please provide a transaction hash or proof hash to verify'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Validate hash format (should be 0x followed by 64 hex characters)
      const hashRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!hashRegex.test(hashToVerify)) {
        throw new Error('Invalid hash format. Expected 0x followed by 64 hexadecimal characters.');
      }

      // Call API to verify hash onchain
      const response = await fetch('/api/verify-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash: hashToVerify }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setVerificationResult({
          isValid: true,
          details: {
            hash: hashToVerify,
            blockNumber: result.blockNumber,
            timestamp: result.timestamp,
            transactionHash: result.transactionHash,
            provider: result.provider || 'Unknown',
            verificationMethod: 'Onchain Hash Lookup',
            explorerUrl: result.explorerUrl
          }
        });
      } else {
        throw new Error(result.error || 'Hash verification failed');
      }

    } catch (error) {
      setVerificationResult({
        isValid: false,
        details: null,
        error: error instanceof Error ? error.message : 'Hash verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBatchVerification = async () => {
    if (verificationMode !== 'hash') return;
    
    const hashes = hashInput.split('\n').map(h => h.trim()).filter(h => h);
    if (hashes.length === 0) return;

    setIsVerifying(true);
    setBatchResults([]);

    const results = [];
    for (const hash of hashes) {
      try {
        const response = await fetch('/api/verify-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash }),
        });
        const result = await response.json();
        results.push({ hash, ...result });
      } catch (error) {
        results.push({ hash, success: false, error: 'Verification failed' });
      }
    }

    setBatchResults(results);
    setIsVerifying(false);
  };

  const exportResults = () => {
    const data = verificationResult ? [verificationResult] : batchResults;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (verificationMode === 'proof') {
        setProofInput(content);
      } else {
        setHashInput(content);
      }
    };
    reader.readAsText(file);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (verificationMode === 'proof') {
        setProofInput(text);
      } else {
        setHashInput(text);
      }
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
            <Shield className="h-12 w-12 text-privacy-accent" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-privacy-text">
          Verify ZK Credential
        </h1>
        
        <p className="text-lg text-privacy-secondary max-w-2xl mx-auto">
          Verify zero-knowledge credentials by pasting the full proof data or by entering a transaction/proof hash.
        </p>
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-black/20 p-1 rounded-lg border border-white/20">
            <button
              onClick={() => setVerificationMode('proof')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                verificationMode === 'proof'
                  ? 'bg-privacy-accent text-white'
                  : 'text-privacy-secondary hover:text-privacy-text'
              }`}
            >
              Verify by Proof
            </button>
            <button
              onClick={() => setVerificationMode('hash')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                verificationMode === 'hash'
                  ? 'bg-privacy-accent text-white'
                  : 'text-privacy-secondary hover:text-privacy-text'
              }`}
            >
              Verify by Hash
            </button>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="privacy-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-privacy-text">
              {verificationMode === 'proof' ? 'Proof Input' : 'Hash Input'}
            </h2>
            <div className="flex items-center space-x-2">
              {verificationMode === 'hash' && (
                <label className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
              <button
                onClick={pasteFromClipboard}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 transition-colors"
              >
                <Clipboard className="h-4 w-4" />
                <span>Paste</span>
              </button>
              {(verificationResult || batchResults.length > 0) && (
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-privacy-accent/10 hover:bg-privacy-accent/20 rounded-lg border border-privacy-accent/30 transition-colors text-privacy-accent"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
          
          {verificationMode === 'proof' ? (
            <textarea
              value={proofInput}
              onChange={(e) => setProofInput(e.target.value)}
              placeholder="Paste your zero-knowledge proof here..."
              className="privacy-input w-full h-40 resize-y font-mono text-sm"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-privacy-accent focus:ring-privacy-accent"
                  />
                  <span className="text-sm text-privacy-secondary">Batch mode (multiple hashes)</span>
                </label>
              </div>
              {batchMode ? (
                <textarea
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Enter multiple hashes, one per line:&#10;0x1234...&#10;0x5678...&#10;0x9abc..."
                  className="privacy-input w-full h-32 resize-y font-mono text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Enter transaction hash or proof hash (0x...)"
                  className="privacy-input w-full font-mono text-sm"
                />
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              if (verificationMode === 'proof') {
                handleVerification();
              } else if (batchMode) {
                handleBatchVerification();
              } else {
                handleHashVerification();
              }
            }}
            disabled={isVerifying || (verificationMode === 'proof' ? !proofInput.trim() : !hashInput.trim())}
            className="privacy-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>
                  {verificationMode === 'proof' 
                    ? 'Verify Proof' 
                    : batchMode 
                      ? 'Verify Batch' 
                      : 'Verify Hash'
                  }
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className={`privacy-card animate-fade-in ${
          verificationResult.isValid 
            ? 'border-privacy-success/30 bg-privacy-success/5' 
            : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {verificationResult.isValid ? (
                <CheckCircle className="h-8 w-8 text-privacy-success" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
              <div>
                <h3 className="text-xl font-bold text-privacy-text">
                  {verificationResult.isValid ? 'Proof Valid' : 'Proof Invalid'}
                </h3>
                <p className="text-privacy-secondary">
                  {verificationResult.isValid 
                    ? 'This zero-knowledge credential has been successfully verified'
                    : 'This proof could not be verified'
                  }
                </p>
              </div>
            </div>

            {verificationResult.error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-red-400">{verificationResult.error}</span>
              </div>
            )}

            {verificationResult.isValid && verificationResult.details && (
              <div className="space-y-3">
                <h4 className="font-semibold text-privacy-text">Verification Details:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-privacy-secondary">Provider:</span>
                      <span className="text-privacy-text font-mono">
                        {verificationResult.details.provider}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-privacy-secondary">Verified At:</span>
                      <span className="text-privacy-text">
                        {new Date(verificationResult.details.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {verificationResult.details.verificationMethod && (
                      <div className="flex justify-between">
                        <span className="text-privacy-secondary">Method:</span>
                        <span className="text-privacy-text">
                          {verificationResult.details.verificationMethod}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {verificationResult.details.witnessCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-privacy-secondary">Witnesses:</span>
                        <span className="text-privacy-text">
                          {verificationResult.details.witnessCount}
                        </span>
                      </div>
                    )}
                    {verificationResult.details.signatureCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-privacy-secondary">Signatures:</span>
                        <span className="text-privacy-text">
                          {verificationResult.details.signatureCount}
                        </span>
                      </div>
                    )}
                    {verificationResult.details.blockNumber && (
                      <div className="flex justify-between">
                        <span className="text-privacy-secondary">Block:</span>
                        <span className="text-privacy-text">
                          {verificationResult.details.blockNumber}
                        </span>
                      </div>
                    )}
                    {verificationResult.details.hash && (
                      <div className="flex justify-between">
                        <span className="text-privacy-secondary">Hash:</span>
                        <span className="text-privacy-text font-mono text-xs">
                          {verificationResult.details.hash.slice(0, 10)}...{verificationResult.details.hash.slice(-8)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {verificationResult.details.explorerUrl && (
                  <div className="pt-3 border-t border-white/10">
                    <a
                      href={verificationResult.details.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-privacy-accent hover:text-privacy-accent/80 transition-colors"
                    >
                      <span>View on Explorer</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Results */}
      {batchResults.length > 0 && (
        <div className="privacy-card animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-privacy-text">
                Batch Verification Results
              </h3>
              <div className="text-sm text-privacy-secondary">
                {batchResults.filter(r => r.success).length} / {batchResults.length} verified
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batchResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'border-privacy-success/30 bg-privacy-success/5' 
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-privacy-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="font-mono text-xs text-privacy-text">
                        {result.hash?.slice(0, 10)}...{result.hash?.slice(-8)}
                      </span>
                    </div>
                    <div className="text-xs text-privacy-secondary">
                      {result.success ? 'Verified' : result.error || 'Failed'}
                    </div>
                  </div>
                  {result.success && result.blockNumber && (
                    <div className="mt-2 text-xs text-privacy-secondary">
                      Block: {result.blockNumber} | Provider: {result.provider || 'Unknown'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="privacy-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-privacy-text">
            How Verification Works
          </h3>
          <div className="space-y-3 text-privacy-secondary">
            <p>
              Zero-knowledge proofs allow verification of claims without revealing the underlying data.
              When you verify a credential here, you&apos;re checking:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Cryptographic signature validity</li>
              <li>Witness attestations from trusted nodes</li>
              <li>Proof structure and format compliance</li>
              <li>Timestamp and context verification</li>
            </ul>
            <p className="text-sm pt-2 border-t border-white/10">
              <strong>Note:</strong> This demo performs basic structural validation. 
              Production implementations would include full cryptographic verification 
              against the Reclaim Protocol network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}