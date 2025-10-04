'use client';

import { useState, useRef } from 'react';
import { Shield, Lock, Eye, Copy, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
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

export default function Home() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [currentProviderName, setCurrentProviderName] = useState<string>('');
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

  const handleProviderVerification = async (provider: Provider) => {
    setIsVerifying(true);
    setError(null);
    setProofData(null);
    setSelectedProvider(provider);
    setCurrentProviderName(provider.name);
    
    try {
      const sessionId = uuidv4();
      const res = await fetch(`/api/generate-config?sessionId=${sessionId}&providerId=${provider.id}`);
      const { reclaimProofRequestConfig } = await res.json();
      
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(reclaimProofRequestConfig);
      reclaimProofRequestRef.current = reclaimProofRequest;
      
      await reclaimProofRequest.triggerReclaimFlow();
      pollForProofFromBackend(sessionId, setProofData, setError, 2000, 90);
    } catch (err) {
      setError(`Failed to initialize ${provider.name} verification. Please try again.`);
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

        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`privacy-card hover:scale-105 transition-all duration-200 cursor-pointer group ${
                isVerifying && selectedProvider?.id === provider.id 
                  ? 'ring-2 ring-privacy-accent' 
                  : 'hover:border-privacy-accent/30'
              }`}
              onClick={() => !isVerifying && handleProviderVerification(provider)}
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

                {isVerifying && selectedProvider?.id === provider.id ? (
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-privacy-accent"></div>
                    <span className="text-privacy-accent">Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2 text-privacy-secondary group-hover:text-privacy-accent transition-colors">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>Click to Verify</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Stats */}
      <ProviderStats />

      {/* Proof Display */}
      {proofData && (
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}