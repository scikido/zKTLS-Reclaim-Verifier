'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

interface ProofData {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: any[];
}

export default function Home() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGmailVerification = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      // Initialize Reclaim proof request
      const reclaimProofRequest = await ReclaimProofRequest.init(
        process.env.NEXT_PUBLIC_RECLAIM_APP_ID || '',
        process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET || '',
        'f9f383fd-32d9-4c54-942f-5e9fda349762' // Provider ID for Gmail
      );

      // Generate request URL
      const requestUrl = await reclaimProofRequest.getRequestUrl();

      // Start session and wait for proof
      await reclaimProofRequest.startSession({
        onSuccess: (proofs: any) => {
          if (proofs && proofs.length > 0) {
            setProofData(proofs[0]);
          }
          setIsVerifying(false);
        },
        onError: (error: any) => {
          setError('Verification failed. Please try again.');
          setIsVerifying(false);
        }
      });

      // Open verification URL in new window
      window.open(requestUrl, '_blank');
      
    } catch (err) {
      setError('Failed to initialize verification. Please check your configuration.');
      setIsVerifying(false);
    }
  };

  const copyProofToClipboard = async () => {
    if (proofData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(proofData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy proof to clipboard');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
            <Shield className="h-16 w-16 text-privacy-accent animate-pulse-glow" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-privacy-text">
          Zero-Knowledge
          <span className="block text-privacy-accent">Identity Verification</span>
        </h1>
        
        <p className="text-xl text-privacy-secondary max-w-2xl mx-auto leading-relaxed">
          Verify your Gmail account without exposing personal data. 
          Generate cryptographic proofs that preserve your privacy while establishing trust.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="privacy-card text-center space-y-4">
          <Lock className="h-10 w-10 text-privacy-accent mx-auto" />
          <h3 className="text-xl font-semibold">Zero-Knowledge Proofs</h3>
          <p className="text-privacy-secondary">
            Verify your identity without revealing sensitive information
          </p>
        </div>
        
        <div className="privacy-card text-center space-y-4">
          <Eye className="h-10 w-10 text-privacy-accent mx-auto" />
          <h3 className="text-xl font-semibold">Privacy First</h3>
          <p className="text-privacy-secondary">
            Your personal data never leaves your device during verification
          </p>
        </div>
        
        <div className="privacy-card text-center space-y-4">
          <CheckCircle className="h-10 w-10 text-privacy-accent mx-auto" />
          <h3 className="text-xl font-semibold">Cryptographically Secure</h3>
          <p className="text-privacy-secondary">
            Tamper-proof credentials backed by blockchain technology
          </p>
        </div>
      </div>

      {/* Verification Section */}
      <div className="privacy-card max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-privacy-text">
            Verify Your Gmail Account
          </h2>
          
          <p className="text-privacy-secondary">
            Click the button below to start the verification process. 
            You'll be redirected to securely prove your Gmail ownership.
          </p>

          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGmailVerification}
            disabled={isVerifying}
            className="privacy-button w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verify My Gmail</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Proof Display */}
      {proofData && (
        <div className="privacy-card animate-fade-in">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-privacy-success" />
              <h3 className="text-xl font-bold text-privacy-text">
                Verification Successful!
              </h3>
            </div>
            
            <p className="text-privacy-secondary">
              Your Gmail account has been verified. Here's your zero-knowledge proof:
            </p>

            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-privacy-text mb-2">Proof Data:</h4>
                <pre className="text-xs text-privacy-secondary overflow-x-auto">
                  {JSON.stringify(proofData, null, 2)}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyProofToClipboard}
                  className="privacy-button flex items-center justify-center space-x-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Proof</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const url = `/verify?proof=${encodeURIComponent(JSON.stringify(proofData))}`;
                    window.open(url, '_blank');
                  }}
                  className="privacy-button bg-privacy-success hover:bg-privacy-success/90"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Preview Verification</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}