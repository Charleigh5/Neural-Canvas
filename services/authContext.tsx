/**
 * Auth Context
 * React context for managing authentication state across the app.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokenManager, UserProfile, ApiError } from './apiService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          const profile = await authApi.getCurrentUser();
          setUser(profile);
        } catch {
          // Token invalid, clear it
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      await authApi.login(email, password);
      const profile = await authApi.getCurrentUser();
      setUser(profile);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Login failed';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string): Promise<boolean> => {
      setError(null);
      setIsLoading(true);

      try {
        await authApi.register(email, password, displayName);
        // Auto-login after registration
        return await login(email, password);
      } catch (err) {
        const message = err instanceof ApiError ? err.detail : 'Registration failed';
        setError(message);
        setIsLoading(false);
        return false;
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
