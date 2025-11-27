'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface WalletConnectionProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  showBalance?: boolean;
  className?: string;
}

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
}

export default function WalletConnection({ 
  onConnect, 
  onDisconnect, 
  onError,
  showBalance = false,
  className = ""
}: WalletConnectionProps) {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null
  });

  const [copiedAddress, setCopiedAddress] = useState(false);

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          setState(prev => ({ 
            ...prev, 
            address: accounts[0], 
            chainId,
            error: null 
          }));
          
          if (showBalance) {
            await getBalance(accounts[0]);
          }
          
          onConnect?.(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setState(prev => ({ 
        ...prev, 
        address: null, 
        balance: null, 
        chainId: null,
        error: null 
      }));
      onDisconnect?.();
    } else {
      // User switched accounts
      setState(prev => ({ 
        ...prev, 
        address: accounts[0],
        error: null 
      }));
      
      if (showBalance) {
        getBalance(accounts[0]);
      }
      
      onConnect?.(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setState(prev => ({ ...prev, chainId }));
    // Reload the page to reset the dapp state
    window.location.reload();
  };

  const getBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to ETH
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      setState(prev => ({ ...prev, balance: balanceInEth }));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Check if we're on Base Sepolia testnet
      if (chainId !== '0x14a34') { // Base Sepolia chain ID
        await switchToBaseSepolia();
      }

      setState(prev => ({ 
        ...prev, 
        address: accounts[0], 
        chainId,
        isConnecting: false,
        error: null
      }));

      if (showBalance) {
        await getBalance(accounts[0]);
      }

      onConnect?.(accounts[0]);

    } catch (error: any) {
      const errorMessage = parseWalletError(error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  };

  const switchToBaseSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // Base Sepolia
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia-explorer.base.org'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  };

  const switchWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Request accounts will prompt the user to select/switch accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      setState(prev => ({ 
        ...prev, 
        address: accounts[0], 
        chainId,
        isConnecting: false,
        error: null
      }));

      if (showBalance) {
        await getBalance(accounts[0]);
      }

      onConnect?.(accounts[0]);

    } catch (error: any) {
      const errorMessage = parseWalletError(error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  };

  const disconnectWallet = () => {
    setState({
      address: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      error: null
    });
    onDisconnect?.();
  };

  const parseWalletError = (error: any): string => {
    if (error.code === 4001) {
      return 'Wallet connection was rejected by user';
    }
    if (error.code === -32002) {
      return 'Wallet connection request is already pending';
    }
    return error.message || 'Failed to connect wallet';
  };

  const copyAddress = async () => {
    if (state.address) {
      try {
        await navigator.clipboard.writeText(state.address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: string | null) => {
    switch (chainId) {
      case '0x14a34':
        return 'Base Sepolia';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x89':
        return 'Polygon';
      case '0x2105':
        return 'Base';
      default:
        return 'Network Not yet Supported';
    }
  };

  const isCorrectNetwork = () => {
    return state.chainId === '0x14a34'; // Base Sepolia
  };

  if (state.address) {
    return (
      <Card className={`privacy-card ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-privacy-text">
                    {formatAddress(state.address)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0 hover:bg-privacy-accent/10"
                  >
                    {copiedAddress ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-privacy-secondary" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      isCorrectNetwork() 
                        ? 'text-green-500 border-green-500/30' 
                        : 'text-yellow-500 border-yellow-500/30'
                    }`}
                  >
                    {getNetworkName(state.chainId)}
                  </Badge>
                  {showBalance && state.balance && (
                    <span className="text-xs text-privacy-secondary">
                      {state.balance} ETH
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isCorrectNetwork() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToBaseSepolia}
                  className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Switch Network
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={switchWallet}
                disabled={state.isConnecting}
                className="border-privacy-accent/30 text-privacy-accent hover:bg-privacy-accent/10"
              >
                <Wallet className="h-3 w-3 mr-1" />
                Switch Wallet
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectWallet}
                className="hover:bg-red-500/10 text-privacy-secondary hover:text-red-500"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`privacy-card ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-privacy-accent/10 border border-privacy-accent/20">
            <Wallet className="h-6 w-6 text-privacy-accent" />
          </div>
          <div>
            <CardTitle className="text-privacy-text">Connect Wallet</CardTitle>
            <CardDescription className="text-privacy-secondary">
              Connect your Web3 wallet to interact with the blockchain
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={connectWallet}
          disabled={state.isConnecting}
          className="w-full privacy-button"
        >
          {state.isConnecting ? (
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

        <div className="text-center space-y-2">
          <p className="text-xs text-privacy-secondary">
            Don&apos;t have a wallet? 
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open('https://metamask.io/', '_blank')}
              className="p-0 h-auto text-privacy-accent hover:text-privacy-accent/80"
            >
              <ExternalLink className="h-3 w-3 ml-1 mr-1" />
              Install MetaMask
            </Button>
          </p>
          <p className="text-xs text-privacy-secondary">
            This app works on Sepolia testnet. Get free test ETH from the 
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open('https://sepoliafaucet.com/', '_blank')}
              className="p-0 h-auto text-privacy-accent hover:text-privacy-accent/80"
            >
              <ExternalLink className="h-3 w-3 ml-1 mr-1" />
              Sepolia faucet
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}