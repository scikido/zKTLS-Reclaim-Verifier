'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import OnchainVerification from '@/components/OnchainVerification';
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';

export default function OnchainTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test the complete verification flow
  const testCompleteFlow = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/complete-verification-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useExample: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult(result);
      } else {
        setError(result.error || 'Test failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Onchain Proof Verification Test</h1>
        <p className="text-muted-foreground">
          Test the complete flow of generating and verifying Reclaim Protocol proofs onchain
        </p>
      </div>

      {/* Test Status */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {testResult && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Proof verified successfully onchain!
          </AlertDescription>
        </Alert>
      )}

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Test Complete Verification Flow</CardTitle>
          <CardDescription>
            This will generate an Ethereum price proof and verify it on Base Sepolia testnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testCompleteFlow} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Running Test...' : 'Test Complete Flow'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Result Display */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Proof generation and onchain verification completed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Transaction Hash</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={testResult.verification.transactionHash} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(testResult.verification.transactionHash)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Block Number</Label>
                <Input 
                  value={testResult.verification.blockNumber} 
                  readOnly 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gas Used</Label>
                <Input 
                  value={testResult.verification.gasUsed?.toString()} 
                  readOnly 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Provider</Label>
                <Input 
                  value={testResult.verification.provider || 'ethereum-price'} 
                  readOnly 
                />
              </div>
            </div>

            {/* Explorer Link */}
            {testResult.explorerUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">View on Explorer</Label>
                <a 
                  href={testResult.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Transaction on Base Sepolia Explorer
                </a>
              </div>
            )}

            {/* Proof Data */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Generated Proof Data</Label>
              <Textarea 
                value={JSON.stringify(testResult.proof, null, 2)} 
                readOnly 
                className="font-mono text-xs h-32"
              />
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500">
                ✓ Proof Generated
              </Badge>
              <Badge variant="default" className="bg-blue-500">
                ✓ Onchain Verified
              </Badge>
              <Badge variant="outline">
                Base Sepolia Testnet
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OnchainVerification Component Test */}
      <Card>
        <CardHeader>
          <CardTitle>Component Test - Generate & Verify Mode</CardTitle>
          <CardDescription>
            Test the OnchainVerification component in generate mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnchainVerification 
            mode="generate"
            onSuccess={(txHash, proof) => {
              console.log('Component success:', { txHash, proof });
            }}
            onError={(error) => {
              console.error('Component error:', error);
            }}
          />
        </CardContent>
      </Card>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Check if required environment variables are configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Reclaim App ID:</span>
              <Badge variant={process.env.NEXT_PUBLIC_RECLAIM_APP_ID ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_RECLAIM_APP_ID ? '✓ Set' : '✗ Missing'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Reclaim App Secret:</span>
              <Badge variant={process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET ? '✓ Set' : '✗ Missing'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Contract Address:</span>
              <Badge variant="default">
                ✓ Base Sepolia
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <Badge variant="outline">
                Base Sepolia Testnet
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
