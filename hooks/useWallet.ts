'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null
  });

  // Check wallet connection on mount
  useEffect(() => {
    checkConnection();

    // Listen for account and chain changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (accounts.length > 0) {
          setState(prev => ({
            ...prev,
            address: accounts[0],
            chainId,
            isConnected: true,
            error: null
          }));
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setState(prev => ({
        ...prev,
        address: null,
        isConnected: false,
        error: null
      }));
    } else {
      setState(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true,
        error: null
      }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    setState(prev => ({ ...prev, chainId }));
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'No Web3 wallet detected. Please install MetaMask.'
      }));
      return false;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Switch to Sepolia if not already connected
      if (chainId !== '0xaa36a7') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
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
        address: accounts[0],
        chainId: '0xaa36a7',
        isConnected: true,
        isConnecting: false,
        error: null
      }));

      return true;
    } catch (error: any) {
      const errorMessage = error.code === 4001
        ? 'Connection rejected by user'
        : error.message || 'Failed to connect wallet';

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));

      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null
    });
  }, []);

  const isCorrectNetwork = () => {
    return state.chainId === '0xaa36a7';
  };

  return {
    ...state,
    connect,
    disconnect,
    isCorrectNetwork
  };
}