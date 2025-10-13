'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import TransactionStatus from '@/components/TransactionStatus';

interface ProofData {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: any[];
}

interface OnchainVerificationProps {
  proof: ProofData;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

type VerificationStatus = 'idle' | 'connecting' | 'submitting' | 'confirming' | 'success' | 'error';

interface OnchainVerificationState {
  status: VerificationStatus;
  walletAddress: string | null;
  transactionHash: string | null;
  error: string | null;
  progress: number;
  blockNumber?: number;
  gasUsed?: string;
}

export default function OnchainVerification({ proof, onSuccess, onError }: OnchainVerificationProps) {
  const [state, setState] = useState<OnchainVerificationState>({
    status: 'idle',
    walletAddress: null,
    transactionHash: null,
    error: null,
    progress: 0
  });

  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setState(prev => ({ ...prev, walletAddress: accounts[0] }));
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, status: 'connecting', error: null, progress: 20 }));

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

      // Check if we're on the correct network (Sepolia)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      setState(prev => ({ 
        ...prev, 
        walletAddress: accounts[0], 
        status: 'idle',
        progress: 0
      }));

    } catch (error: any) {
      const errorMessage = error.code === 4001 
        ? 'Wallet connection was rejected by user'
        : error.message || 'Failed to connect wallet';
      
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: errorMessage,
        progress: 0
      }));
      
      onError?.(errorMessage);
    }
  };

  const submitProofOnchain = async () => {
    if (!state.walletAddress) {
      await connectWallet();
      return;
    }

    setState(prev => ({ 
      ...prev, 
      status: 'submitting', 
      error: null, 
      progress: 30 
    }));

    try {
      // Simulate proof submission process
      // In real implementation, this would interact with the smart contract
      
      // Step 1: Prepare proof data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({ ...prev, progress: 50 }));

      // Step 2: Submit transaction
      setState(prev => ({ ...prev, status: 'confirming', progress: 70 }));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Wait for confirmation
      const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockBlockNumber = Math.floor(Math.random() * 1000000) + 12000000;
      const mockGasUsed = (Math.floor(Math.random() * 50000) + 100000).toLocaleString();
      
      setState(prev => ({ 
        ...prev, 
        status: 'success', 
        transactionHash: mockTxHash,
        blockNumber: mockBlockNumber,
        gasUsed: mockGasUsed,
        progress: 100
      }));

      onSuccess?.(mockTxHash);

    } catch (error: any) {
      const errorMessage = parseContractError(error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: errorMessage,
        progress: 0
      }));
      
      onError?.(errorMessage);
    }
  };

  const parseContractError = (error: any): string => {
    if (error.code === 4001) {
      return 'Transaction was rejected by user';
    }
    if (error.code === -32603) {
      return 'Insufficient funds to pay for gas fees';
    }
    if (error.reason) {
      switch (error.reason) {
        case 'InvalidProofStructure':
          return 'The proof data is invalid or malformed';
        case 'ProofAlreadyExists':
          return 'This proof has already been submitted to the blockchain';
        case 'InvalidSignature':
          return 'The proof signature is invalid';
        default:
          return error.reason;
      }
    }
    return error.message || 'An unexpected error occurred';
  };

  const copyTransactionHash = async () => {
    if (state.transactionHash) {
      try {
        await navigator.clipboard.writeText(state.transactionHash);
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      } catch (error) {
        console.error('Failed to copy transaction hash:', error);
      }
    }
  };

  const getStatusMessage = () => {
    switch (state.status) {
      case 'connecting':
        return 'Connecting to your wallet...';
      case 'submitting':
        return 'Preparing proof for blockchain submission...';
      case 'confirming':
        return 'Waiting for transaction confirmation...';
      case 'success':
        return 'Proof successfully verified onchain!';
      case 'error':
        return 'Verification failed';
      default:
        return 'Ready to verify onchain';
    }
  };

  const getProgressColor = () => {
    switch (state.status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-privacy-accent';
    }
  };

  const resetVerification = () => {
    setState(prev => ({
      ...prev,
      status: 'idle',
      error: null,
      transactionHash: null,
      progress: 0
    }));
  };

  return (
    <Card className="privacy-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-privacy-accent/10 border border-privacy-accent/20">
            <Shield className="h-6 w-6 text-privacy-accent" />
          </div>
          <div>
            <CardTitle className="text-privacy-text">Onchain Verification</CardTitle>
            <CardDescription className="text-privacy-secondary">
              Submit your {proof.claimData.provider} proof to the blockchain for permanent verification
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wallet Connection Status */}
        {state.walletAddress ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-privacy-text">Wallet Connected</p>
                <p className="text-xs text-privacy-secondary">
                  {`${state.walletAddress.slice(0, 6)}...${state.walletAddress.slice(-4)}`}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              Sepolia Testnet
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-privacy-text">Wallet Required</p>
                <p className="text-xs text-privacy-secondary">
                  Connect your Web3 wallet to continue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(state.status !== 'idle' && state.status !== 'error') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-privacy-text">{getStatusMessage()}</p>
              <span className="text-xs text-privacy-secondary">{state.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-privacy-accent h-2 rounded-full transition-all duration-300" 
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Status Display */}
        {(state.status === 'submitting' || state.status === 'confirming' || state.status === 'success') && state.transactionHash && (
          <TransactionStatus
            transactionHash={state.transactionHash}
            status={state.status === 'success' ? 'confirmed' : state.status === 'confirming' ? 'confirming' : 'pending'}
            confirmations={state.status === 'success' ? 3 : state.status === 'confirming' ? 1 : 0}
            requiredConfirmations={3}
            gasUsed={state.gasUsed}
            blockNumber={state.blockNumber}
            onRetry={resetVerification}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!state.walletAddress ? (
            <Button
              onClick={connectWallet}
              disabled={state.status === 'connecting'}
              className="flex-1 privacy-button"
            >
              {state.status === 'connecting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          ) : state.status === 'success' ? (
            <Button
              onClick={resetVerification}
              variant="outline"
              className="flex-1 border-privacy-accent/30 text-privacy-accent hover:bg-privacy-accent/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Another Proof
            </Button>
          ) : (
            <Button
              onClick={submitProofOnchain}
              disabled={state.status === 'submitting' || state.status === 'confirming' || state.status === 'connecting'}
              className="flex-1 privacy-button"
            >
              {state.status === 'submitting' || state.status === 'confirming' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {state.status === 'submitting' ? 'Submitting...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Onchain
                </>
              )}
            </Button>
          )}
        </div>

        {/* Information */}
        <div className="text-center text-xs text-privacy-secondary space-y-1">
          <p>
            Onchain verification creates a permanent, immutable record of your proof on the Sepolia blockchain.
          </p>
          <p>
            This process requires a small amount of ETH for gas fees (~$0.01-0.05).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}