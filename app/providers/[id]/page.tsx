'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Copy, CheckCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { getProviderById } from '@/lib/providers';
import Link from 'next/link';

interface ProofData {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: any[];
}

export default function ProviderPage() {
  const params = useParams();
  const providerId = params.id as string;
  const provider = getProviderById(providerId);

  const [isVerifying, setIsVerifying] = useState(false);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reclaimProofRequestRef = useRef<any>(null);

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="privacy-card">
          <h1 className="text-2xl font-bold text-privacy-text mb-4">Provider Not Found</h1>
          <p className="text-privacy-secondary mb-6">The requested provider could not be found.</p>
          <Link href="/providers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Providers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryColors = {
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    social: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    finance: 'bg-green-500/10 text-green-400 border-green-500/20',
    identity: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    productivity: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

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

  const handleVerification = async () => {
    setIsVerifying(true);
    setError(null);
    setProofData(null);
    
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

  const getProviderInfo = (providerId: string) => {
    const providerInfo = {
      gmail: {
        details: "Verify your Gmail account ownership and basic profile information without exposing your email content or personal data.",
        requirements: ["Active Gmail account", "Browser access to Gmail", "Completed Google OAuth flow"],
        verifies: ["Email address ownership", "Account creation date", "Account status"]
      },
      github: {
        details: "Verify your GitHub profile, contribution history, and repository ownership while keeping your code and activity private.",
        requirements: ["Active GitHub account", "Public profile", "Browser access to GitHub"],
        verifies: ["Username and profile", "Account creation date", "Public repository count", "Contribution activity"]
      },
      twitter: {
        details: "Verify your Twitter/X account, follower count, and account metrics without revealing your tweets or personal information.",
        requirements: ["Active Twitter/X account", "Public profile", "Browser access to Twitter"],
        verifies: ["Username and handle", "Account creation date", "Follower count", "Account verification status"]
      },
      linkedin: {
        details: "Verify your professional LinkedIn profile and connections while maintaining privacy of your professional network.",
        requirements: ["Active LinkedIn account", "Public profile", "Browser access to LinkedIn"],
        verifies: ["Professional profile", "Connection count", "Account creation date", "Profile completeness"]
      },
      instagram: {
        details: "Verify your Instagram account and follower metrics without exposing your posts or personal content.",
        requirements: ["Active Instagram account", "Public or business profile", "Browser access to Instagram"],
        verifies: ["Username and profile", "Follower count", "Account type", "Account creation date"]
      },
      spotify: {
        details: "Verify your Spotify listening history and music preferences while keeping your personal playlists private.",
        requirements: ["Active Spotify account", "Browser access to Spotify", "Spotify Web Player access"],
        verifies: ["Account type", "Listening history", "Top artists/tracks", "Playlist count"]
      },
      amazon: {
        details: "Verify your Amazon purchase history and account status without revealing specific purchases or personal information.",
        requirements: ["Active Amazon account", "Purchase history", "Browser access to Amazon"],
        verifies: ["Account status", "Purchase history existence", "Account creation date", "Prime membership status"]
      },
      uber: {
        details: "Verify your Uber ride history and user rating while maintaining privacy of your travel patterns and locations.",
        requirements: ["Active Uber account", "Ride history", "Browser access to Uber"],
        verifies: ["Account status", "Ride count", "User rating", "Account creation date"]
      }
    };

    return providerInfo[providerId as keyof typeof providerInfo] || {
      details: `Verify your ${provider.name} account while maintaining your privacy.`,
      requirements: [`Active ${provider.name} account`, "Browser access", "Completed authentication flow"],
      verifies: ["Account ownership", "Basic profile information", "Account status"]
    };
  };

  const info = getProviderInfo(provider.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link href="/providers">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </Link>

      {/* Provider Header */}
      <div className="privacy-card">
        <div className="flex items-start space-x-6">
          <div className="text-6xl">{provider.icon}</div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-privacy-text">{provider.name}</h1>
              <Badge className={categoryColors[provider.category]}>
                {provider.category}
              </Badge>
            </div>
            <p className="text-lg text-privacy-secondary">{provider.description}</p>
            <p className="text-privacy-secondary">{info.details}</p>
          </div>
        </div>
      </div>

      {/* Verification Section */}
      <div className="privacy-card">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-privacy-text">
            Verify Your {provider.name} Account
          </h2>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-privacy-text">Requirements</h3>
              <ul className="space-y-2">
                {info.requirements.map((req, index) => (
                  <li key={index} className="flex items-center space-x-2 text-privacy-secondary">
                    <CheckCircle className="h-4 w-4 text-privacy-success" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-privacy-text">What Gets Verified</h3>
              <ul className="space-y-2">
                {info.verifies.map((item, index) => (
                  <li key={index} className="flex items-center space-x-2 text-privacy-secondary">
                    <Shield className="h-4 w-4 text-privacy-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-white/10">
            <Button
              onClick={handleVerification}
              disabled={isVerifying}
              size="lg"
              className="w-full md:w-auto"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying {provider.name}...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Start {provider.name} Verification</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Proof Display */}
      {proofData && (
        <div className="privacy-card animate-fade-in">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-privacy-success" />
              <h3 className="text-xl font-bold text-privacy-text">
                {provider.name} Verification Successful!
              </h3>
            </div>
            <p className="text-privacy-secondary">
              Your {provider.name} account has been verified successfully while keeping your data private.
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