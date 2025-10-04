'use client';

import { useState, useRef } from 'react';
import { Shield, Lock, Eye, Copy, CheckCircle, AlertCircle, Sparkles, X, QrCode } from 'lucide-react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { providers, Provider, getProvidersByCategory } from '@/lib/providers';
import ProviderStats from '@/components/ProviderStats';

interface ProofData {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: any[];
}

type VerificationStatus = 'idle' | 'generating' | 'waiting' | 'success' | 'error' | 'cancelled';

export default function Home() {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [currentProviderName, setCurrentProviderName] = useState<string>('');
  const [requestUrl, setRequestUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const reclaimProofRequestRef = useRef<any>(null);
  const isCancelledRef = useRef(false);

  const pollForProofFromBackend = async (
    sessionId: string,
    interval = 2000,
    maxAttempts = 90
  ) => {
    let attempts = 0;
    const poll = async () => {
      if (isCancelledRef.current) return;
      
      try {
        const res = await fetch(`/api/reclaim-callback?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.found && data.proof) {
          setProofData(data.proof);
          setStatus('success');
          setStatusMessage(`${currentProviderName} verification completed successfully!`);
          return;
        }
        attempts++;
        if (attempts < maxAttempts && !isCancelledRef.current) {
          setTimeout(poll, interval);
        } else if (!isCancelledRef.current) {
          console.log('Backend polling timed out, relying on SDK polling');
        }
      } catch (err) {
        console.log('Backend polling failed, relying on SDK polling:', err);
      }
    };
    poll();
  };

  const pollForProofFromSDK = async (interval = 3000, maxAttempts = 60) => {
    let attempts = 0;
    const poll = async () => {
      if (isCancelledRef.current) return;
      
      try {
        const reclaimProofRequest = reclaimProofRequestRef.current;
        if (!reclaimProofRequest) return;
        
        const proofs = await reclaimProofRequest.getProofs();
        if (proofs && proofs.length > 0) {
          setProofData(proofs[0]);
          setStatus('success');
          setStatusMessage(`${currentProviderName} verification completed successfully!`);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts && !isCancelledRef.current) {
          setTimeout(poll, interval);
        } else if (!isCancelledRef.current) {
          setError('Verification timed out. Please try again.');
          setStatus('error');
          setStatusMessage('Verification failed due to timeout.');
        }
      } catch (err) {
        // SDK polling failed, continue trying
        attempts++;
        if (attempts < maxAttempts && !isCancelledRef.current) {
          setTimeout(poll, interval);
        }
      }
    };
    poll();
  };

  const handleProviderVerification = async (provider: Provider) => {
    setStatus('generating');
    isCancelledRef.current = false;
    setError(null);
    setProofData(null);
    setSelectedProvider(provider);
    setCurrentProviderName(provider.name);
    setStatusMessage(`Initializing ${provider.name} verification...`);
    setRequestUrl(null);
    
    try {
      const sessionId = uuidv4();
      const res = await fetch(`/api/generate-config?sessionId=${sessionId}&providerId=${provider.id}`);
      const { reclaimProofRequestConfig } = await res.json();
      
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(reclaimProofRequestConfig);
      reclaimProofRequestRef.current = reclaimProofRequest;
      
      // Start the verification flow and get URL
      setStatus('waiting');
      setStatusMessage(`Starting ${provider.name} verification flow...`);
      
      await reclaimProofRequest.triggerReclaimFlow();
      
      // Try to get the request URL if available
      try {
        const url = await reclaimProofRequest.getRequestUrl();
        setRequestUrl(url);
        setStatusMessage(`Scan the QR code or complete verification in the popup window`);
      } catch (e) {
        // If getRequestUrl is not available, just show waiting message
        setStatusMessage(`Complete verification in the popup window or mobile device`);
      }
      
      // Poll for proof from both backend and direct SDK
      pollForProofFromBackend(sessionId);
      pollForProofFromSDK();
    } catch (err) {
      setError(`Failed to initialize ${provider.name} verification. Please try again.`);
      setStatus('error');
      setStatusMessage(`Failed to start ${provider.name} verification.`);
    }
  };

  const handleCancelVerification = () => {
    isCancelledRef.current = true;
    setStatus('cancelled');
    setStatusMessage('Verification cancelled by user.');
    setRequestUrl(null);
    setSelectedProvider(null);
    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
    }, 3000);
  };

  const handleRetryVerification = () => {
    if (selectedProvider) {
      handleProviderVerification(selectedProvider);
    }
  };

  const handleManualCheck = async () => {
    try {
      const reclaimProofRequest = reclaimProofRequestRef.current;
      if (!reclaimProofRequest) {
        setError('Session not found. Please restart verification.');
        return;
      }
      
      setStatusMessage('Checking for proof manually...');
      const proofs = await reclaimProofRequest.getProofs();
      if (proofs && proofs.length > 0) {
        setProofData(proofs[0]);
        setStatus('success');
        setStatusMessage(`${currentProviderName} verification completed successfully!`);
      } else {
        setStatusMessage('Proof not found yet. Please complete verification and try again.');
      }
    } catch (err) {
      console.error('Manual check failed:', err);
      setStatusMessage('Manual check failed. Please complete verification and try again.');
    }
  };

  const resetVerification = () => {
    isCancelledRef.current = false;
    setStatus('idle');
    setError(null);
    setProofData(null);
    setSelectedProvider(null);
    setCurrentProviderName('');
    setRequestUrl(null);
    setStatusMessage('');
    setCopied(false);
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

  const categoryColors = {
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    social: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    finance: 'bg-green-500/10 text-green-400 border-green-500/20',
    identity: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    productivity: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
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
        
        <p className="text-xl text-privacy-secondary max-w-3xl mx-auto leading-relaxed">
          Verify your digital accounts without exposing personal data. 
          Generate cryptographic proofs that preserve your privacy while establishing trust across platforms.
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
          <Sparkles className="h-10 w-10 text-privacy-accent mx-auto" />
          <h3 className="text-xl font-semibold">Multiple Platforms</h3>
          <p className="text-privacy-secondary">
            Support for Gmail, GitHub, Twitter, LinkedIn, and more
          </p>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-privacy-text mb-4">
            Choose Your Platform
          </h2>
          <p className="text-privacy-secondary max-w-2xl mx-auto">
            Select any platform below to generate a zero-knowledge proof of your account ownership
          </p>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className="max-w-2xl mx-auto">
            <Alert className={`${
              status === 'success' ? 'border-privacy-success/30 bg-privacy-success/5' :
              status === 'error' ? 'border-red-500/30 bg-red-500/5' :
              status === 'cancelled' ? 'border-yellow-500/30 bg-yellow-500/5' :
              'border-privacy-accent/30 bg-privacy-accent/5'
            }`}>
              {status === 'success' && <CheckCircle className="h-4 w-4 text-privacy-success" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
              {status === 'cancelled' && <X className="h-4 w-4 text-yellow-400" />}
              {(status === 'generating' || status === 'waiting') && <QrCode className="h-4 w-4 text-privacy-accent" />}
              <AlertTitle>
                {status === 'success' && 'Verification Successful'}
                {status === 'error' && 'Verification Failed'}
                {status === 'cancelled' && 'Verification Cancelled'}
                {status === 'generating' && 'Preparing Verification'}
                {status === 'waiting' && 'Waiting for Verification'}
              </AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {error && status === 'error' && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Display */}
        {status === 'waiting' && (
          <div className="privacy-card max-w-md mx-auto animate-fade-in">
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-privacy-text">
                Verify Your {currentProviderName} Account
              </h3>
              
              {requestUrl ? (
                <>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode value={requestUrl} size={200} />
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-privacy-secondary text-sm">
                      Scan the QR code with your mobile device or click the link below
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => window.open(requestUrl, '_blank')}
                        className="w-full"
                      >
                        Open Verification Link
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleCancelVerification}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Verification
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-privacy-accent"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-privacy-secondary text-sm">
                      Complete the verification process in the popup window or on your mobile device
                    </p>
                    
                    <Button
                      variant="outline"
                      onClick={handleCancelVerification}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Verification
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={handleManualCheck}
                      className="w-full"
                    >
                      Check Manually
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Provider Selection Grid - Only show when not in verification flow */}
        {status === 'idle' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="privacy-card hover:scale-105 transition-all duration-200 cursor-pointer group hover:border-privacy-accent/30"
                onClick={() => handleProviderVerification(provider)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{provider.icon}</div>
                    <Badge className={categoryColors[provider.category]}>
                      {provider.category}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-privacy-text group-hover:text-privacy-accent transition-colors">
                      {provider.name}
                    </h3>
                    <p className="text-privacy-secondary text-sm mt-2">
                      {provider.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-2 text-privacy-secondary group-hover:text-privacy-accent transition-colors">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>Click to Verify</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons for Error/Cancelled States */}
        {(status === 'error' || status === 'cancelled') && (
          <div className="flex justify-center gap-4">
            {status === 'error' && selectedProvider && (
              <Button onClick={handleRetryVerification}>
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={resetVerification}>
              Choose Different Provider
            </Button>
          </div>
        )}
      </div>

      {/* Provider Stats */}
      <ProviderStats />

      {/* Proof Display */}
      {proofData && status === 'success' && (
        <div className="privacy-card animate-fade-in max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-privacy-success" />
              <h3 className="text-xl font-bold text-privacy-text">
                {currentProviderName} Verification Successful!
              </h3>
            </div>
            <p className="text-privacy-secondary">
              Your {currentProviderName} account has been verified successfully while keeping your data private.
            </p>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-privacy-text mb-2">Proof Data:</h4>
                <pre className="text-xs text-privacy-secondary overflow-x-auto max-h-40">
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
                <Button
                  variant="outline"
                  onClick={resetVerification}
                >
                  Verify Another Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}