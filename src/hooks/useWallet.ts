import { useState, useCallback } from 'react';
import type { WalletAsset } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

interface WalletData {
  totalUSD: number;
  assets: WalletAsset[];
}

interface UseWalletReturn {
  wallet: WalletData | null;
  isLoading: boolean;
  error: string | null;
  fetchWallet: (credentialId?: string) => Promise<void>;
  clearError: () => void;
}

const getToken = () => localStorage.getItem(TOKEN_KEY);

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async (credentialId?: string) => {
    const token = getToken();
    if (!token) {
      setError('Não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/wallet/balances`);
      if (credentialId) url.searchParams.append('credential_id', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar carteira');
      }

      setWallet(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar carteira');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    wallet,
    isLoading,
    error,
    fetchWallet,
    clearError,
  };
}
