import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// Types
export interface Portfolio {
    id: string;
    label: string;
    exchange: string;
    is_active: boolean;
    last_sync_at: string | null;
    api_key_masked?: string;
}

interface PortfolioContextType {
    portfolios: Portfolio[];
    activePortfolioId: string | null;
    isLoading: boolean;
    error: string | null;
    setActivePortfolio: (id: string | null) => void;
    refreshPortfolios: () => Promise<void>;
    addPortfolio: (data: { label: string; apiKey: string; secret: string; exchange: string }) => Promise<void>;
    removePortfolio: (id: string) => Promise<void>;
    updatePortfolio: (id: string, data: { label?: string; api_key?: string; secret?: string }) => Promise<void>;
    syncPortfolio: (id: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';
const ACTIVE_PORTFOLIO_KEY = 'visor_active_portfolio';

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [activePortfolioId, setActivePortfolioIdState] = useState<string | null>(() => {
        return localStorage.getItem(ACTIVE_PORTFOLIO_KEY);
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const setActivePortfolio = (id: string | null) => {
        setActivePortfolioIdState(id);
        if (id) {
            localStorage.setItem(ACTIVE_PORTFOLIO_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
        }
    };

    const getAuthHeader = () => {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? { 'Authorization': `Bearer ${token}` } : null;
    };

    const refreshPortfolios = useCallback(async () => {
        const headers = getAuthHeader();
        if (!headers) {
            setPortfolios([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/credentials`, { headers });

            if (response.ok) {
                const data = await response.json();
                // Handle different response structures (array or { data: array })
                let items: Portfolio[] = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data.data && Array.isArray(data.data)) {
                    items = data.data;
                } else if (data.credentials && Array.isArray(data.credentials)) {
                    items = data.credentials;
                } else if (data.data && data.data.credentials && Array.isArray(data.data.credentials)) {
                    items = data.data.credentials;
                }

                console.log("Fetched portfolios:", items);
                setPortfolios(items);
            } else {
                const errData = await response.json().catch(() => ({}));
                console.error('Failed to fetch credentials:', errData);
                setPortfolios([]);
            }
        } catch (err) {
            console.error('Failed to fetch portfolios', err);
            setPortfolios([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        refreshPortfolios();
    }, [refreshPortfolios]);

    // Ensure active portfolio exists in list, otherwise select first available
    useEffect(() => {
        if (!isLoading && portfolios.length > 0) {
            // If active ID is no longer valid or null, switch to first one
            if (!activePortfolioId || !portfolios.find(p => p.id === activePortfolioId)) {
                setActivePortfolio(portfolios[0].id);
            }
        } else if (!isLoading && portfolios.length === 0 && activePortfolioId) {
            // If no portfolios, clear active
            setActivePortfolio(null);
        }
    }, [isLoading, portfolios, activePortfolioId]);

    const addPortfolio = async (data: { label: string; apiKey: string; secret: string; exchange: string }) => {
        const headers = getAuthHeader();
        if (!headers) throw new Error("Não autenticado");

        const response = await fetch(`${API_BASE_URL}/credentials`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                label: data.label,
                exchange: data.exchange,
                api_key: data.apiKey,
                secret: data.secret
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Erro ao adicionar credencial");
        }

        // Refresh list to get new ID
        await refreshPortfolios();
    };

    const removePortfolio = async (id: string) => {
        const headers = getAuthHeader();
        if (!headers) throw new Error("Não autenticado");

        const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Erro ao remover credencial");
        }

        setPortfolios(prev => prev.filter(p => p.id !== id));
        if (activePortfolioId === id) {
            setActivePortfolio(null);
        }
    };

    const updatePortfolio = async (id: string, data: { label?: string; api_key?: string; secret?: string }) => {
        const headers = getAuthHeader();
        if (!headers) throw new Error("Não autenticado");

        const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
            method: 'PATCH',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Erro ao atualizar credencial");
        }

        await refreshPortfolios();
    };

    // New sync function
    const syncPortfolio = async (id: string) => {
        const headers = getAuthHeader();
        if (!headers) return; // Silent fail

        // Fire and forget sync request
        await fetch(`${API_BASE_URL}/credentials/${id}/sync`, {
            method: 'POST',
            headers
        }).catch(err => console.error("Sync trigger failed", err));
    };

    return (
        <PortfolioContext.Provider value={{
            portfolios,
            activePortfolioId,
            isLoading,
            error,
            setActivePortfolio,
            refreshPortfolios,
            addPortfolio,
            removePortfolio,
            updatePortfolio,
            syncPortfolio
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
