import { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'visor_jwt';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  has_bybit_credentials?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setState(prev => ({ ...prev, token, isLoading: false }));
      // Fetch user data
      fetchUser(token);
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setState({ token: null, user: null, isLoading: false, error: null });
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setState(prev => ({ ...prev, user: data.data, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Invalid credentials');
      }

      const data: AuthResponse = await response.json();
      const { token, user } = data.data;

      localStorage.setItem(TOKEN_KEY, token);
      setState({ token, user, isLoading: false, error: null });
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      return false;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      const { token, user } = data.data;

      localStorage.setItem(TOKEN_KEY, token);
      setState({ token, user, isLoading: false, error: null });
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null, isLoading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const isAuthenticated = useMemo(() => !!state.token, [state.token]);

  return {
    ...state,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };
}
