'use client';

import { useState } from 'react';
import { Shield, Wallet, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WalletConnection from '@/components/WalletConnection';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const { address, isConnected, connect, disconnect, isCorrectNetwork } = useWallet();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleWalletConnect = async () => {
    const success = await connect();
    if (success) {
      setShowWalletModal(false);
    }
  };

  const handleWalletDisconnect = () => {
    disconnect();
    setShowWalletModal(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Providers', href: '/providers' },
  ];

  return (
    <>
      <header className={`bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-privacy-accent/10 border border-privacy-accent/20">
                <Shield className="h-6 w-6 text-privacy-accent" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-privacy-text">ZK Verify</h1>
                <p className="text-xs text-privacy-secondary">Zero-Knowledge Identity</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-privacy-secondary hover:text-privacy-accent transition-colors text-sm font-medium"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Wallet Connection */}
            <div className="flex items-center gap-4">
              {isConnected && address ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className={`w-2 h-2 rounded-full ${isCorrectNetwork() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-privacy-text font-mono">
                      {formatAddress(address)}
                    </span>
                    <Badge variant="outline" className={`text-xs ${isCorrectNetwork() ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                      {isCorrectNetwork() ? 'Sepolia' : 'Wrong Network'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWalletModal(true)}
                    className="text-privacy-secondary hover:text-privacy-accent"
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleWalletConnect}
                  size="sm"
                  className="privacy-button"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-privacy-secondary hover:text-privacy-accent"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-white/10 py-4">
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-privacy-secondary hover:text-privacy-accent transition-colors text-sm font-medium px-2 py-1"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.name}
                  </a>
                ))}
                {isConnected && address && (
                  <div className="px-2 py-1 border-t border-white/10 pt-3 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${isCorrectNetwork() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-privacy-text font-mono">
                        {formatAddress(address)}
                      </span>
                      <Badge variant="outline" className={`text-xs ${isCorrectNetwork() ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                        {isCorrectNetwork() ? 'Sepolia' : 'Wrong Network'}
                      </Badge>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <WalletConnection
              onConnect={(address) => {
                handleWalletConnect();
              }}
              onDisconnect={handleWalletDisconnect}
              onError={(error) => console.error('Wallet connection error:', error)}
              showBalance={true}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 text-privacy-secondary hover:text-privacy-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}