'use client';

import { useState } from 'react';
import { Wallet, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import WalletConnection from '@/components/WalletConnection';
import { useWallet } from '@/hooks/useWallet';

export default function WalletTestPage() {
  const { address, isConnected, chainId, error, isCorrectNetwork } = useWallet();
  const [connectionMessage, setConnectionMessage] = useState<string>('');

  const handleConnect = (addr: string) => {
    setConnectionMessage(`Successfully connected to ${addr}`);
    setTimeout(() => setConnectionMessage(''), 3000);
  };

  const handleDisconnect = () => {
    setConnectionMessage('Wallet disconnected');
    setTimeout(() => setConnectionMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
              <Wallet className="h-12 w-12 text-privacy-accent" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-privacy-text">
            Wallet Connection Test
          </h1>
          <p className="text-lg text-privacy-secondary max-w-2xl mx-auto">
            Test the wallet connection functionality with different components and configurations.
          </p>
        </div>

        {/* Connection Messages */}
        {connectionMessage && (
          <Alert className="border-privacy-accent/30 bg-privacy-accent/5">
            <CheckCircle className="h-4 w-4 text-privacy-accent" />
            <AlertTitle>Connection Update</AlertTitle>
            <AlertDescription>{connectionMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Status */}
        <Card className="privacy-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-privacy-accent" />
              Wallet Status
            </CardTitle>
            <CardDescription>
              Current wallet connection information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-privacy-secondary">Connection Status</p>
                <p className={`text-lg font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div>
                <p className="text-sm text-privacy-secondary">Network Status</p>
                <p className={`text-lg font-semibold ${isCorrectNetwork() ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isCorrectNetwork() ? 'Correct Network' : 'Wrong Network'}
                </p>
              </div>
              {address && (
                <div>
                  <p className="text-sm text-privacy-secondary">Wallet Address</p>
                  <p className="text-sm font-mono text-privacy-text break-all">
                    {address}
                  </p>
                </div>
              )}
              {chainId && (
                <div>
                  <p className="text-sm text-privacy-secondary">Chain ID</p>
                  <p className="text-sm text-privacy-text">
                    {chainId} ({chainId === '0xaa36a7' ? 'Sepolia Testnet' : 'Unknown Network'})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connect Wallet Button Examples */}
        <Card className="privacy-card">
          <CardHeader>
            <CardTitle>ConnectWalletButton Examples</CardTitle>
            <CardDescription>
              Different configurations of the ConnectWalletButton component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-privacy-text">Default Button</h4>
              <ConnectWalletButton 
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-privacy-text">Button with Address Display</h4>
              <ConnectWalletButton 
                showAddress={true}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-privacy-text">Small Outline Button</h4>
              <ConnectWalletButton 
                size="sm"
                variant="outline"
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-privacy-text">Large Button</h4>
              <ConnectWalletButton 
                size="lg"
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </CardContent>
        </Card>

        {/* Full Wallet Connection Component */}
        <Card className="privacy-card">
          <CardHeader>
            <CardTitle>Full WalletConnection Component</CardTitle>
            <CardDescription>
              Complete wallet connection interface with balance display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnection
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onError={(err) => console.error('Wallet error:', err)}
              showBalance={true}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center space-y-4">
          <p className="text-privacy-secondary">
            Test the wallet connection and then navigate to other pages to see the persistent connection.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="/"
              className="text-privacy-accent hover:text-privacy-accent/80 underline"
            >
              Go to Home
            </a>
            <a 
              href="/dashboard"
              className="text-privacy-accent hover:text-privacy-accent/80 underline"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
    </div>
  );
}