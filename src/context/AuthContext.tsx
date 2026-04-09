import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, setAuthToken } from '../api/client';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  employee?: any;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'appan_token';
const STORAGE_KEY_USER = 'appan_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_TOKEN),
          AsyncStorage.getItem(STORAGE_KEY_USER),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const setSession = async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_TOKEN, newToken),
      AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser)),
    ]);
  };

  const clearSession = async () => {
    try {
      setAuthToken(null);
      setToken(null);
      setUser(null);
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEY_USER),
      ]);
      try {
        await apiClient.post('/logout');
      } catch {
        // ignore logout failures on client
      }
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, setSession, clearSession }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

