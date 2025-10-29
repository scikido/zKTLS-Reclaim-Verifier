'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  ExternalLink, 
  Calendar, 
  Hash, 
  User, 
  Search, 
  SortAsc, 
  SortDesc,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OnchainProofRecord, ContractUtils } from '@/lib/contracts/ProofRegistry';
import ProofDetailModal from '@/components/ProofDetailModal';

interface ProofDashboardProps {
  userAddress?: string;
  onConnectWallet?: () => void;
}

type SortField = 'timestamp' | 'provider' | 'proofHash';
type SortDirection = 'asc' | 'desc';

interface ProofDashboardState {
  proofs: OnchainProofRecord[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedProvider: string;
  refreshing: boolean;
}

export default function ProofDashboard({ userAddress, onConnectWallet }: ProofDashboardProps) {
  const [state, setState] = useState<ProofDashboardState>({
    proofs: [],
    loading: true,
    error: null,
    searchTerm: '',
    sortField: 'timestamp',
    sortDirection: 'desc',
    selectedProvider: 'all',
    refreshing: false
  });

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<OnchainProofRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock data for demonstration - in real implementation, this would fetch from blockchain
  const mockProofs: OnchainProofRecord[] = [
    {
      proofHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      submitter: userAddress || '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
      provider: 'Gmail',
      isValid: true,
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockNumber: 12345678
    },
    {
      proofHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
      submitter: userAddress || '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 172800), // 2 days ago
      provider: 'GitHub',
      isValid: true,
      transactionHash: '0xbcdef12345678901bcdef12345678901bcdef12345678901bcdef12345678901',
      blockNumber: 12345600
    },
    {
      proofHash: '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef12',
      submitter: userAddress || '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 259200), // 3 days ago
      provider: 'Twitter',
      isValid: true,
      transactionHash: '0xcdef123456789012cdef123456789012cdef123456789012cdef123456789012',
      blockNumber: 12345500
    }
  ];

  // Simulate loading user proofs
  useEffect(() => {
    if (userAddress) {
      loadUserProofs();
    } else {
      setState(prev => ({ ...prev, loading: false, proofs: [] }));
    }
  }, [userAddress]);

  const loadUserProofs = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would call the blockchain
      // const proofs = await web3Service.getUserProofs(userAddress);
      
      setState(prev => ({ 
        ...prev, 
        proofs: userAddress ? mockProofs : [], 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load onchain proofs. Please try again.', 
        loading: false 
      }));
    }
  };

  const refreshProofs = async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await loadUserProofs();
    setState(prev => ({ ...prev, refreshing: false }));
  };

  const handleSort = (field: SortField) => {
    setState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openProofDetail = (proof: OnchainProofRecord) => {
    setSelectedProof(proof);
    setIsDetailModalOpen(true);
  };

  const closeProofDetail = () => {
    setSelectedProof(null);
    setIsDetailModalOpen(false);
  };

  // Filter and sort proofs
  const filteredAndSortedProofs = state.proofs
    .filter(proof => {
      const matchesSearch = proof.provider.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                           proof.proofHash.toLowerCase().includes(state.searchTerm.toLowerCase());
      const matchesProvider = state.selectedProvider === 'all' || 
                             proof.provider.toLowerCase() === state.selectedProvider.toLowerCase();
      return matchesSearch && matchesProvider;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (state.sortField) {
        case 'timestamp':
          comparison = Number(a.timestamp - b.timestamp);
          break;
        case 'provider':
          comparison = a.provider.localeCompare(b.provider);
          break;
        case 'proofHash':
          comparison = a.proofHash.localeCompare(b.proofHash);
          break;
      }
      
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });

  // Get unique providers for filter
  const uniqueProviders = Array.from(new Set(state.proofs.map(proof => proof.provider)));

  const getSortIcon = (field: SortField) => {
    if (state.sortField !== field) return null;
    return state.sortDirection === 'asc' ? 
      <SortAsc className="h-4 w-4 ml-1" /> : 
      <SortDesc className="h-4 w-4 ml-1" />;
  };

  // Wallet not connected state
  if (!userAddress) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="privacy-card text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
                <Wallet className="h-12 w-12 text-privacy-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl text-privacy-text">Connect Your Wallet</CardTitle>
            <CardDescription className="text-privacy-secondary">
              Connect your Web3 wallet to view your onchain verified proofs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onConnectWallet}
              className="privacy-button"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-privacy-text">Onchain Proof Dashboard</h1>
          <p className="text-privacy-secondary mt-1">
            Manage your blockchain-verified identity proofs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-privacy-secondary border-privacy-secondary/30">
            {ContractUtils.formatAddress(userAddress)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProofs}
            disabled={state.refreshing}
            className="border-privacy-accent/30 text-privacy-accent hover:bg-privacy-accent/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${state.refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="privacy-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-privacy-secondary text-sm">Total Proofs</p>
                <p className="text-2xl font-bold text-privacy-text">{state.proofs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-privacy-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="privacy-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-privacy-secondary text-sm">Platforms</p>
                <p className="text-2xl font-bold text-privacy-text">{uniqueProviders.length}</p>
              </div>
              <User className="h-8 w-8 text-privacy-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="privacy-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-privacy-secondary text-sm">Latest Proof</p>
                <p className="text-sm font-medium text-privacy-text">
                  {state.proofs.length > 0 
                    ? ContractUtils.formatTimestamp(
                        Math.max(...state.proofs.map(p => Number(p.timestamp))) as any
                      ).split(',')[0]
                    : 'None'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-privacy-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="privacy-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-privacy-secondary" />
              <Input
                placeholder="Search by provider or proof hash..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10 privacy-input"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={state.selectedProvider === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, selectedProvider: 'all' }))}
                className={state.selectedProvider === 'all' ? 'bg-privacy-accent hover:bg-privacy-accent/90' : ''}
              >
                All
              </Button>
              {uniqueProviders.map(provider => (
                <Button
                  key={provider}
                  variant={state.selectedProvider === provider ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, selectedProvider: provider }))}
                  className={state.selectedProvider === provider ? 'bg-privacy-accent hover:bg-privacy-accent/90' : ''}
                >
                  {provider}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {state.loading && (
        <Card className="privacy-card">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-privacy-accent"></div>
            </div>
            <p className="text-privacy-secondary">Loading your onchain proofs...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!state.loading && filteredAndSortedProofs.length === 0 && state.proofs.length === 0 && (
        <Card className="privacy-card text-center">
          <CardContent className="p-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
                <Shield className="h-12 w-12 text-privacy-accent" />
              </div>
            </div>
            <CardTitle className="text-xl text-privacy-text mb-2">No Onchain Proofs Yet</CardTitle>
            <CardDescription className="text-privacy-secondary mb-4">
              You haven&apos;t submitted any proofs to the blockchain yet. 
              Generate a proof and verify it onchain to see it here.
            </CardDescription>
            <Button 
              onClick={() => window.location.href = '/'}
              className="privacy-button"
            >
              Generate Your First Proof
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!state.loading && filteredAndSortedProofs.length === 0 && state.proofs.length > 0 && (
        <Card className="privacy-card text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 text-privacy-secondary mx-auto mb-4" />
            <CardTitle className="text-xl text-privacy-text mb-2">No Results Found</CardTitle>
            <CardDescription className="text-privacy-secondary">
              No proofs match your current search criteria. Try adjusting your filters.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Proofs Table - Desktop */}
      {!state.loading && filteredAndSortedProofs.length > 0 && (
        <>
          {/* Desktop Table View */}
          <Card className="privacy-card hidden md:block">
            <CardHeader>
              <CardTitle className="text-privacy-text">
                Your Onchain Proofs ({filteredAndSortedProofs.length})
              </CardTitle>
              <CardDescription className="text-privacy-secondary">
                Click on any proof to view detailed blockchain confirmation information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-privacy-secondary/20">
                    <TableHead 
                      className="text-privacy-secondary cursor-pointer hover:text-privacy-accent transition-colors"
                      onClick={() => handleSort('provider')}
                    >
                      <div className="flex items-center">
                        Provider
                        {getSortIcon('provider')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-privacy-secondary cursor-pointer hover:text-privacy-accent transition-colors"
                      onClick={() => handleSort('proofHash')}
                    >
                      <div className="flex items-center">
                        Proof Hash
                        {getSortIcon('proofHash')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-privacy-secondary cursor-pointer hover:text-privacy-accent transition-colors"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center">
                        Verified On
                        {getSortIcon('timestamp')}
                      </div>
                    </TableHead>
                    <TableHead className="text-privacy-secondary">Status</TableHead>
                    <TableHead className="text-privacy-secondary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProofs.map((proof) => (
                    <TableRow 
                      key={proof.proofHash} 
                      className="border-privacy-secondary/20 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => openProofDetail(proof)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-privacy-accent border-privacy-accent/30">
                            {proof.provider}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-privacy-text font-mono">
                            {ContractUtils.formatProofHash(proof.proofHash)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(proof.proofHash);
                            }}
                            className="h-6 w-6 p-0 hover:bg-privacy-accent/10"
                          >
                            {copiedHash === proof.proofHash ? (
                              <CheckCircle className="h-3 w-3 text-privacy-success" />
                            ) : (
                              <Copy className="h-3 w-3 text-privacy-secondary" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-privacy-text">
                        {ContractUtils.formatTimestamp(proof.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-privacy-success" />
                          <span className="text-privacy-success text-sm">Verified</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(ContractUtils.getTransactionUrl(proof.transactionHash, 11155111), '_blank');
                            }}
                            className="h-8 px-2 hover:bg-privacy-accent/10 text-privacy-secondary hover:text-privacy-accent"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `/verify?proofHash=${proof.proofHash}`;
                              window.open(url, '_blank');
                            }}
                            className="h-8 px-2 hover:bg-privacy-accent/10 text-privacy-secondary hover:text-privacy-accent"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-privacy-text mb-2">
              Your Onchain Proofs ({filteredAndSortedProofs.length})
            </h3>
            <p className="text-privacy-secondary text-sm">
              Tap on any proof to view detailed information
            </p>
          </div>
          
          {filteredAndSortedProofs.map((proof) => (
            <Card 
              key={proof.proofHash} 
              className="privacy-card cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => openProofDetail(proof)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-privacy-accent border-privacy-accent/30">
                    {proof.provider}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-privacy-success" />
                    <span className="text-privacy-success text-sm">Verified</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-privacy-secondary" />
                    <code className="text-xs text-privacy-text font-mono">
                      {ContractUtils.formatProofHash(proof.proofHash)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(proof.proofHash);
                      }}
                      className="h-6 w-6 p-0 hover:bg-privacy-accent/10"
                    >
                      {copiedHash === proof.proofHash ? (
                        <CheckCircle className="h-3 w-3 text-privacy-success" />
                      ) : (
                        <Copy className="h-3 w-3 text-privacy-secondary" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-privacy-secondary" />
                    <span className="text-xs text-privacy-text">
                      {ContractUtils.formatTimestamp(proof.timestamp)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(ContractUtils.getTransactionUrl(proof.transactionHash, 11155111), '_blank');
                    }}
                    className="h-8 px-2 hover:bg-privacy-accent/10 text-privacy-secondary hover:text-privacy-accent"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `/verify?proofHash=${proof.proofHash}`;
                      window.open(url, '_blank');
                    }}
                    className="h-8 px-2 hover:bg-privacy-accent/10 text-privacy-secondary hover:text-privacy-accent"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {/* Proof Detail Modal */}
      {selectedProof && (
        <ProofDetailModal
          proof={selectedProof}
          isOpen={isDetailModalOpen}
          onClose={closeProofDetail}
        />
      )}
    </div>
  );
}