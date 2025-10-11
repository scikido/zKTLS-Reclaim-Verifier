'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProofDashboard from '@/components/ProofDashboard';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function DashboardPage() {
  const { address, isConnected, connect, error } = useWallet();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    setLocalError(null);
    const success = await connect();
    if (!success && error) {
      setLocalError(error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-privacy-text">
          Onchain Proof Dashboard
        </h1>
        <p className="text-lg text-privacy-secondary max-w-2xl mx-auto">
          View and manage your blockchain-verified identity proofs. 
          All proofs are stored immutably on the Sepolia testnet.
        </p>
      </div>

      {/* Error Display */}
      {(error || localError) && (
        <Alert variant="destructive" className="max-w-2xl mx-auto border-red-500/30 bg-red-500/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Component */}
      <ProofDashboard 
        userAddress={isConnected ? address || undefined : undefined}
        onConnectWallet={handleConnectWallet}
      />

      {/* Network Info */}
      <div className="text-center">
        <div className="privacy-card max-w-md mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm text-privacy-secondary">
              Connected to <span className="text-privacy-accent font-semibold">Sepolia Testnet</span>
            </p>
            <p className="text-xs text-privacy-secondary">
              This is a test environment. No real ETH is required.
            </p>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}