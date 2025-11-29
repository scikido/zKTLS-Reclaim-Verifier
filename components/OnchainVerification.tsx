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
import { CONTRACT_CONFIG, SIMPLE_VERIFICATION_ABI } from '@/lib/contracts/ProofRegistry';

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
  proof?: ProofData; // Make proof optional for proof generation mode
  onSuccess?: (txHash: string, proof?: any) => void;
  onError?: (error: string) => void;
  mode?: 'verify' | 'generate'; // New mode for component behavior
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

export default function OnchainVerification({ proof, onSuccess, onError, mode = 'verify' }: OnchainVerificationProps) {
  const [state, setState] = useState<OnchainVerificationState>({
    status: 'idle',
    walletAddress: null,
    transactionHash: null,
    error: null,
    progress: 0
  });

  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);

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

      // Check if we're on the correct network (Base Sepolia)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const baseSepoliaChainId = '0x14a34'; // 84532 in decimal
      if (chainId !== baseSepoliaChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseSepoliaChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: baseSepoliaChainId,
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
      progress: 20 
    }));

    try {
      let proofToVerify = proof || generatedProof;
      
      if (!proofToVerify && mode === 'generate') {
        // Generate proof first
        setState(prev => ({ ...prev, progress: 30 }));
        
        const generateResponse = await fetch('/api/generate-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            method: "GET",
            responseMatches: [
              {
                type: "regex",
                value: "\\{\"ethereum\":\\{\"usd\":(?<price>[\\d\\.]+)\\}\\}"
              }
            ]
          })
        });
        
        const generateResult = await generateResponse.json();
        
        if (!generateResult.success) {
          throw new Error(generateResult.error || 'Failed to generate proof');
        }
        
        proofToVerify = generateResult.proof;
        setGeneratedProof(proofToVerify);
      }
      
      if (!proofToVerify) {
        throw new Error('No proof available for verification');
      }

      // Step 2: Verify proof onchain using user's wallet
      setState(prev => ({ ...prev, status: 'confirming', progress: 70 }));
      
      const result = await verifyProofWithWallet(proofToVerify);
      
      setState(prev => ({ 
        ...prev, 
        status: 'success', 
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed.toString(),
        progress: 100
      }));

      onSuccess?.(result.transactionHash, proofToVerify);

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

  const verifyProofWithWallet = async (proof: any) => {
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask.');
    }

    if (!state.walletAddress) {
      throw new Error('Please connect your wallet first.');
    }

    try {
      // Import ethers dynamically for client-side use
      const { ethers } = await import('ethers');
      
      // Create provider and signer with 'any' network to handle network changes
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const signer = provider.getSigner();
      
      // Check network - switch to Base Sepolia if needed
      const network = await provider.getNetwork();
      const baseSepoliaChainId = 84532;
      
      if (network.chainId !== baseSepoliaChainId) {
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
      }

      // Step 1: Get contract address (from env variable or config)
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || CONTRACT_CONFIG.baseSepolia.contractAddress;
      
      // Validate contract address is not a burn address
      if (contractAddress === "0x000000000000000000000000000000000000dEaD" || 
          contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error('Invalid contract address. Please configure NEXT_PUBLIC_CONTRACT_ADDRESS environment variable with a valid contract address.');
      }

      console.log('Using contract address:', contractAddress);

      // Step 2: Generate proof hash from proof data
      // Hash the proof JSON string to create a unique identifier
      // Note: JSON.stringify order matters, so we create a deterministic representation
      const proofString = JSON.stringify(proof, Object.keys(proof).sort());
      const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proofString));
      console.log('Generated proof hash:', proofHash);
      console.log('Proof data used for hash:', proofString.substring(0, 200) + '...');

      // Step 3: Extract provider name from proof
      const providerName = proof?.claimInfo?.provider || 
                           proof?.claimData?.provider || 
                           'unknown';
      
      // Validate provider name is not empty
      if (!providerName || providerName.trim() === '' || providerName === 'unknown') {
        console.warn('Provider name is empty or unknown. Proof structure:', {
          hasClaimInfo: !!proof?.claimInfo,
          hasClaimData: !!proof?.claimData,
          claimInfoProvider: proof?.claimInfo?.provider,
          claimDataProvider: proof?.claimData?.provider,
          proofKeys: proof ? Object.keys(proof) : []
        });
      }
      
      console.log('Extracted provider:', providerName);

      // Step 4: Create contract instance and call verifyProof
      console.log('Calling simple verification contract verifyProof function...');
      const contract = new ethers.Contract(contractAddress, SIMPLE_VERIFICATION_ABI, signer);
      
      // Check if proof is already verified
      try {
        const isAlreadyVerified = await contract.isProofVerified(proofHash);
        if (isAlreadyVerified) {
          throw new Error('This proof has already been verified on the blockchain. Each proof can only be verified once.');
        }
        console.log('Proof not yet verified, proceeding...');
      } catch (checkError: any) {
        // If the error is about already being verified, rethrow it
        if (checkError.message && checkError.message.includes('already been verified')) {
          throw checkError;
        }
        // Otherwise, log warning but continue (function might not exist or might error for other reasons)
        console.warn('Could not check proof verification status:', checkError.message);
      }
      
      // Estimate gas first - this will fail if the proof is already verified
      let gasEstimate;
      try {
        console.log('Estimating gas for verifyProof call...');
        gasEstimate = await contract.estimateGas.verifyProof(proofHash, providerName);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError: any) {
        console.error('Gas estimation error:', estimateError);
        
        // Try to extract revert reason
        let errorMessage = estimateError.message || 'Gas estimation failed';
        
        // Check for revert reason in error data
        if (estimateError.reason) {
          errorMessage = estimateError.reason;
        } else if (estimateError.data) {
          try {
            // Try to decode the revert reason
            const decodedError = contract.interface.parseError(estimateError.data);
            if (decodedError) {
              errorMessage = decodedError.name + ': ' + decodedError.args.join(', ');
            }
          } catch (decodeError) {
            // If decoding fails, check for common error messages
            if (errorMessage.includes('execution reverted')) {
              if (errorMessage.includes('Proof already verified')) {
                errorMessage = 'This proof has already been verified on the blockchain.';
              } else {
                errorMessage = 'Contract execution reverted. The proof may be invalid or already verified.';
              }
            }
          }
        }
        
        throw new Error(`Gas estimation failed: ${errorMessage}`);
      }

      // Call the contract's verifyProof function with (proofHash, providerName)
      console.log('Calling verifyProof with proofHash:', proofHash, 'and provider:', providerName);
      
      let tx;
      try {
        tx = await contract.verifyProof(proofHash, providerName, {
          gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer to gas estimate
        });
        console.log('Verification transaction submitted:', tx.hash);
      } catch (txError: any) {
        console.error('Transaction submission error:', txError);
        // Try to extract revert reason
        let errorMsg = txError.message || 'Transaction failed to submit';
        
        if (txError.reason) {
          errorMsg = txError.reason;
        } else if (txError.data) {
          try {
            // Try to decode the revert reason from error data
            const decodedError = contract.interface.parseError(txError.data);
            if (decodedError) {
              errorMsg = `${decodedError.name}: ${decodedError.args.join(', ')}`;
            }
          } catch (decodeErr) {
            // If decoding fails, try to extract from message
            const revertMatch = errorMsg.match(/execution reverted:?\s*"?([^"]+)"?/i);
            if (revertMatch && revertMatch[1]) {
              errorMsg = revertMatch[1];
            }
          }
        }
        
        throw new Error(`Transaction submission failed: ${errorMsg}`);
      }

      // Wait for confirmation and catch revert errors
      let receipt;
      try {
        receipt = await tx.wait();
      } catch (waitError: any) {
        console.error('Transaction wait error:', waitError);
        
        // If we have a transaction hash, try to get the receipt to check status
        if (tx && tx.hash) {
          try {
            const failedReceipt = await provider.getTransactionReceipt(tx.hash);
            if (failedReceipt && failedReceipt.status === 0) {
              // Transaction reverted, try to decode revert reason
              let revertReason = 'Transaction was reverted';
              
              // Try to call the contract's isProofVerified to see if it's already verified
              try {
                const isVerified = await contract.isProofVerified(proofHash);
                if (isVerified) {
                  revertReason = 'Proof already verified';
                }
              } catch (checkError) {
                // Ignore check error
              }
              
              // Try to decode revert reason from transaction
              if (waitError.reason) {
                revertReason = waitError.reason;
              } else if (waitError.message) {
                const revertMatch = waitError.message.match(/execution reverted:?\s*"?([^"]+)"?/i);
                if (revertMatch && revertMatch[1]) {
                  revertReason = revertMatch[1];
                }
              }
              
              throw new Error(`Transaction reverted: ${revertReason}`);
            }
          } catch (receiptError) {
            console.error('Error getting receipt:', receiptError);
          }
        }
        
        throw new Error(waitError.reason || waitError.message || 'Transaction failed. Please check the browser console for details.');
      }
      
      // Check if transaction reverted
      if (receipt && receipt.status === 0) {
        throw new Error('Transaction was reverted. The proof verification failed on the contract.');
      }

      const result = {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        provider: providerName,
        proofHash: proofHash
      };

      // Store the proof in user's dashboard
      try {
        const userAddress = await signer.getAddress();
        await fetch('/api/user-proofs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: userAddress,
            proof: {
              proofHash: proofHash,
              submitter: userAddress,
              timestamp: Math.floor(Date.now() / 1000),
              provider: providerName,
              isValid: true,
              transactionHash: tx.hash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString()
            }
          })
        });
      } catch (storageError) {
        console.warn('Could not store proof in dashboard:', storageError);
      }

      return result;

    } catch (error: any) {
      console.error('=== Wallet verification error ===');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error reason:', error.reason);
      console.error('Error data:', error.data);
      console.error('Error transaction:', error.transaction);
      console.error('Error stack:', error.stack);
      console.error('===============================');
      
      throw error;
    }
  };

  const parseContractError = (error: any): string => {
    console.log('=== Parsing contract error ===');
    console.log('Error type:', typeof error);
    console.log('Error keys:', Object.keys(error));
    console.log('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Check for user rejection first
    if (error.code === 4001) {
      return 'Transaction was rejected by user';
    }
    
    // Check for insufficient funds
    if (error.code === -32603) {
      if (error.message && error.message.includes('insufficient funds')) {
        return 'Insufficient funds to pay for gas fees. Please add more ETH to your wallet.';
      }
      return 'Transaction failed. Please check the browser console for details.';
    }
    
    // Check for execution reverted
    if (error.code === -32000 || error.message?.includes('execution reverted')) {
      let revertReason = 'Contract execution reverted.';
      
      // Try multiple ways to extract the revert reason
      if (error.reason) {
        revertReason = error.reason;
      } else if (error.message) {
        // Try to extract from various formats
        const patterns = [
          /execution reverted:?\s*"?([^"]+)"?/i,
          /revert\s+"?([^"]+)"?/i,
          /Error:\s*(.+)/i
        ];
        
        for (const pattern of patterns) {
          const match = error.message.match(pattern);
          if (match && match[1]) {
            revertReason = match[1].trim();
            break;
          }
        }
      }
      
      // Check for specific known errors
      if (revertReason.includes('Proof already verified') || revertReason.includes('already verified')) {
        return 'This proof has already been verified on the blockchain. Each proof can only be verified once.';
      }
      
      return `Transaction reverted: ${revertReason}`;
    }
    
    // Check for address errors
    if (error.message?.includes('bad address checksum') || error.message?.includes('invalid address')) {
      return 'Invalid contract address. Please check the NEXT_PUBLIC_CONTRACT_ADDRESS configuration.';
    }
    
    // Check for gas estimation errors
    if (error.message?.includes('Gas estimation failed')) {
      return error.message;
    }
    
    // Check for network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Return error reason if available
    if (error.reason) {
          return error.reason;
    }
    
    // Return the error message, or a generic message
    const errorMessage = error.message || 'Transaction failed. Please check the browser console for more details.';
    console.log('Returning error message:', errorMessage);
    return errorMessage;
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
              {mode === 'generate' 
                ? 'Generate and verify a proof on the blockchain for permanent verification'
                : `Submit your ${proof?.claimData?.provider || 'Reclaim'} proof to the blockchain for permanent verification`
              }
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
              Base Sepolia
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
            Onchain verification creates a permanent, immutable record of your proof on the Base Sepolia blockchain.
          </p>
          <p>
            This process requires a small amount of ETH for gas fees (~$0.01-0.05).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}