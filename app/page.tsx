'use client';

import { useState, useRef } from 'react';
import { Shield, Lock, Eye, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';

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
  const [requestUrl, setRequestUrl] = useState<string | null>(null);
  const reclaimProofRequestRef = useRef<any>(null);

  const pollForProofFromBackend = async (
    sessionId: string,
    setProofData: React.Dispatch<React.SetStateAction<ProofData | null>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    interval = 2000,
    maxAttempts = 30
  ) => {
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/reclaim-callback?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.found && data.proof) {
          setProofData(data.proof);
          setIsVerifying(false);
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          setError('Proof not found after waiting. Please try again.');
          setIsVerifying(false);
        }
      } catch (err) {
        setError('Failed to fetch proof from backend. Please try again.');
        setIsVerifying(false);
      }
    };
    poll();
  };

  const handleGmailVerification = async () => {
    setIsVerifying(true);
    setError(null);
    setRequestUrl(null);
    setProofData(null);
    try {
      const sessionId = uuidv4();
      // 1. Fetch config from backend (sessionId is only for backend proof lookup)
      const res = await fetch(`/api/generate-config?sessionId=${sessionId}`);
      const { reclaimProofRequestConfig } = await res.json();
      // 2. Initialize from config
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(reclaimProofRequestConfig);
      reclaimProofRequestRef.current = reclaimProofRequest;
      // 3. Trigger flow
      await reclaimProofRequest.triggerReclaimFlow();

      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log('Successfully created proof', proofs);
          pollForProofFromBackend(sessionId, setProofData, setError, 2000, 90);
          setIsVerifying(false);
          // Handle successful verification - proofs are also sent to your backend callback
        },
        onError: (error) => {
          console.error('Verification failed', error);
          setIsVerifying(false);
          // Handle verification failure
        },
      });
      // 4. Poll backend for proof
      
    } catch (err) {
      setError('Failed to initialize verification. Please check your configuration.');
      setIsVerifying(false);
    }
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const reclaimProofRequest = reclaimProofRequestRef.current;
      if (!reclaimProofRequest) {
        setError('Session not found. Please restart verification.');
        setIsVerifying(false);
        return;
      }
      const proofs = await reclaimProofRequest.getProofs();
      if (proofs && proofs.length > 0) {
        setProofData(proofs[0]);
      } else {
        setError('Proof not found yet. Please try again after completing verification on your device.');
      }
    } catch (err) {
      setError('Failed to fetch proof. Please try again.');
    } finally {
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
            Click the button below to start the verification process. You'll be guided through the optimal flow for your device.
          </p>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleGmailVerification}
            disabled={isVerifying}
            className="w-full md:w-auto"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Preparing...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verify My Gmail</span>
              </span>
            )}
          </Button>
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
              {`Your Gmail ${(JSON.parse(proofData.claimData.context))?.extractedParameters.email} is verified successfully while your data remains only to you.`}
            </p>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-privacy-text mb-2">Proof Data:</h4>
                <pre className="text-xs text-privacy-secondary overflow-x-auto">
                  {JSON.stringify(proofData, null, 2)}
                </pre>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={copyProofToClipboard}
                  className="flex items-center justify-center space-x-2"
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
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const url = `/verify?proof=${encodeURIComponent(JSON.stringify(proofData))}`;
                    window.open(url, '_blank');
                  }}
                  className="bg-privacy-success hover:bg-privacy-success/90"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Preview Verification</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}