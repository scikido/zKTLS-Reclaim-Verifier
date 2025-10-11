'use client';

import { Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';

interface ConnectWalletButtonProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showAddress?: boolean;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function ConnectWalletButton({
  size = 'default',
  variant = 'default',
  className = '',
  showAddress = false,
  onConnect,
  onDisconnect
}: ConnectWalletButtonProps) {
  const { address, isConnected, connect, disconnect, isConnecting, isCorrectNetwork } = useWallet();

  const handleConnect = async () => {
    const success = await connect();
    if (success && address) {
      onConnect?.(address);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    if (showAddress) {
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-privacy-text font-mono">
              {formatAddress(address)}
            </span>
            <Badge variant="outline" className={`text-xs ${isCorrectNetwork() ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
              {isCorrectNetwork() ? 'Sepolia' : 'Wrong Network'}
            </Badge>
          </div>
          <Button
            variant="outline"
            size={size}
            onClick={handleDisconnect}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            Disconnect
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleDisconnect}
        className={`border-red-500/30 text-red-500 hover:bg-red-500/10 ${className}`}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Connected
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={`privacy-button ${className}`}
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}