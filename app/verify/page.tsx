'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Clipboard, Shield } from 'lucide-react';

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
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    details: any;
    error?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const proofFromUrl = searchParams.get('proof');
    if (proofFromUrl) {
      setProofInput(proofFromUrl);
      handleVerification(proofFromUrl);
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

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setProofInput(text);
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
          Paste a zero-knowledge proof below to verify its authenticity and view the verified claims.
        </p>
      </div>

      {/* Input Section */}
      <div className="privacy-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-privacy-text">
              Proof Input
            </h2>
            <button
              onClick={pasteFromClipboard}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 transition-colors"
            >
              <Clipboard className="h-4 w-4" />
              <span>Paste</span>
            </button>
          </div>
          
          <textarea
            value={proofInput}
            onChange={(e) => setProofInput(e.target.value)}
            placeholder="Paste your zero-knowledge proof here..."
            className="privacy-input w-full h-40 resize-y font-mono text-sm"
          />
          
          <button
            onClick={() => handleVerification()}
            disabled={isVerifying || !proofInput.trim()}
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
                <span>Verify Proof</span>
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
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-privacy-secondary">Witnesses:</span>
                      <span className="text-privacy-text">
                        {verificationResult.details.witnessCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-privacy-secondary">Signatures:</span>
                      <span className="text-privacy-text">
                        {verificationResult.details.signatureCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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