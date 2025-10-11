'use client';

import { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Calendar, 
  Hash, 
  User, 
  Shield,
  Clock,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnchainProofRecord, ContractUtils } from '@/lib/contracts/ProofRegistry';

interface ProofDetailModalProps {
  proof: OnchainProofRecord;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProofDetailModal({ proof, isOpen, onClose }: ProofDetailModalProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify?proofHash=${proof.proofHash}`;
  };

  const detailItems = [
    {
      label: 'Proof Hash',
      value: proof.proofHash,
      shortValue: ContractUtils.formatProofHash(proof.proofHash),
      icon: Hash,
      copyKey: 'proofHash'
    },
    {
      label: 'Submitter Address',
      value: proof.submitter,
      shortValue: ContractUtils.formatAddress(proof.submitter),
      icon: User,
      copyKey: 'submitter',
      explorerUrl: ContractUtils.getAddressUrl(proof.submitter, 11155111)
    },
    {
      label: 'Transaction Hash',
      value: proof.transactionHash,
      shortValue: ContractUtils.formatProofHash(proof.transactionHash),
      icon: LinkIcon,
      copyKey: 'transactionHash',
      explorerUrl: ContractUtils.getTransactionUrl(proof.transactionHash, 11155111)
    },
    {
      label: 'Block Number',
      value: proof.blockNumber.toString(),
      shortValue: `#${proof.blockNumber.toLocaleString()}`,
      icon: Clock,
      copyKey: 'blockNumber'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="privacy-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl text-privacy-text">Proof Details</CardTitle>
            <CardDescription className="text-privacy-secondary">
              Blockchain verification information for your {proof.provider} proof
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-privacy-accent/10"
          >
            <X className="h-4 w-4 text-privacy-secondary" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Provider and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-privacy-accent/10 border border-privacy-accent/20">
                <Shield className="h-6 w-6 text-privacy-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-privacy-text">{proof.provider} Verification</h3>
                <p className="text-sm text-privacy-secondary">
                  Verified on {ContractUtils.formatTimestamp(proof.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-privacy-success" />
              <Badge variant="outline" className="text-privacy-success border-privacy-success/30">
                Verified Onchain
              </Badge>
            </div>
          </div>

          {/* Verification Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-privacy-text uppercase tracking-wide">
              Blockchain Details
            </h4>
            
            {detailItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-privacy-secondary" />
                  <div>
                    <p className="text-sm text-privacy-secondary">{item.label}</p>
                    <p className="text-privacy-text font-mono text-sm">{item.shortValue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.explorerUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(item.explorerUrl, '_blank')}
                      className="h-8 px-2 hover:bg-privacy-accent/10 text-privacy-secondary hover:text-privacy-accent"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item.value, item.copyKey)}
                    className="h-8 px-2 hover:bg-privacy-accent/10"
                  >
                    {copiedItem === item.copyKey ? (
                      <CheckCircle className="h-3 w-3 text-privacy-success" />
                    ) : (
                      <Copy className="h-3 w-3 text-privacy-secondary" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Network Information */}
          <div className="p-4 rounded-lg bg-privacy-accent/5 border border-privacy-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-privacy-accent rounded-full"></div>
              <h4 className="text-sm font-semibold text-privacy-text">Network Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-privacy-secondary">Network</p>
                <p className="text-privacy-text">Sepolia Testnet</p>
              </div>
              <div>
                <p className="text-privacy-secondary">Chain ID</p>
                <p className="text-privacy-text">11155111</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={() => copyToClipboard(generateShareableLink(), 'shareableLink')}
              className="flex-1 privacy-button"
            >
              {copiedItem === 'shareableLink' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy Shareable Link
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(ContractUtils.getTransactionUrl(proof.transactionHash, 11155111), '_blank')}
              className="flex-1 border-privacy-accent/30 text-privacy-accent hover:bg-privacy-accent/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Etherscan
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-center text-xs text-privacy-secondary">
            <p>This proof is permanently stored on the Sepolia blockchain and can be independently verified by anyone.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}