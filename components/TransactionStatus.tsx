'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Copy,
  Loader2,
  Hash,
  Calendar,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

interface TransactionStatusProps {
  transactionHash?: string;
  status: TransactionStatus;
  confirmations?: number;
  requiredConfirmations?: number;
  gasUsed?: string;
  blockNumber?: number;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export default function TransactionStatus({
  transactionHash,
  status,
  confirmations = 0,
  requiredConfirmations = 3,
  gasUsed,
  blockNumber,
  error,
  onRetry,
  className = ""
}: TransactionStatusProps) {
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    if (status === 'pending' || status === 'confirming') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Reset timer when status changes to confirmed or failed
  useEffect(() => {
    if (status === 'confirmed' || status === 'failed') {
      setElapsedTime(0);
    }
  }, [status]);

  const copyTransactionHash = async () => {
    if (transactionHash) {
      try {
        await navigator.clipboard.writeText(transactionHash);
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      } catch (error) {
        console.error('Failed to copy transaction hash:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'confirming':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending';
      case 'confirming':
        return `Confirming (${confirmations}/${requiredConfirmations})`;
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'failed':
        return 'Transaction Failed';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'Your transaction has been submitted and is waiting to be included in a block.';
      case 'confirming':
        return 'Your transaction is being confirmed by the network. Please wait for additional confirmations.';
      case 'confirmed':
        return 'Your transaction has been successfully confirmed on the blockchain.';
      case 'failed':
        return 'Your transaction failed to execute. You can try again.';
    }
  };

  const getProgressPercentage = () => {
    switch (status) {
      case 'pending':
        return 25;
      case 'confirming':
        return 25 + (confirmations / requiredConfirmations) * 65;
      case 'confirmed':
        return 100;
      case 'failed':
        return 0;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-privacy-accent';
    }
  };

  return (
    <Card className={`privacy-card ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <CardTitle className="text-privacy-text">{getStatusText()}</CardTitle>
            <CardDescription className="text-privacy-secondary">
              {getStatusDescription()}
            </CardDescription>
          </div>
          {(status === 'pending' || status === 'confirming') && (
            <Badge variant="outline" className="text-privacy-secondary border-privacy-secondary/30">
              {formatTime(elapsedTime)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {status !== 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-privacy-text">Progress</span>
              <span className="text-sm text-privacy-secondary">
                {Math.round(getProgressPercentage())}%
              </span>
            </div>
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
          </div>
        )}

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-privacy-secondary" />
              <span className="text-sm font-medium text-privacy-text">Transaction Hash</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10">
              <code className="text-xs font-mono text-privacy-text flex-1 break-all">
                {transactionHash}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTransactionHash}
                className="h-6 w-6 p-0 hover:bg-privacy-accent/10"
              >
                {copiedTxHash ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-privacy-secondary" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {status === 'confirmed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blockNumber && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-privacy-secondary" />
                <div>
                  <p className="text-xs text-privacy-secondary">Block Number</p>
                  <p className="text-sm text-privacy-text">#{blockNumber.toLocaleString()}</p>
                </div>
              </div>
            )}
            {gasUsed && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-privacy-secondary" />
                <div>
                  <p className="text-xs text-privacy-secondary">Gas Used</p>
                  <p className="text-sm text-privacy-text">{gasUsed}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {status === 'failed' && error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transaction Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {transactionHash && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
              className="flex-1 border-privacy-accent/30 text-privacy-accent hover:bg-privacy-accent/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Etherscan
            </Button>
          )}
          
          {status === 'failed' && onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1 privacy-button"
            >
              Try Again
            </Button>
          )}
        </div>

        {/* Network Information */}
        <div className="text-center text-xs text-privacy-secondary">
          <p>Transaction on Sepolia Testnet • Chain ID: 11155111</p>
        </div>
      </CardContent>
    </Card>
  );
}