import React, { createContext, useContext, useState, type ReactNode,useCallback } from 'react';
import {
  loginUser,
  logoutUser,
  finalizeRegistration,
} from './api';
import type {
  UserProfile,
  LoginPayload,
  RegisterPayload,
} from './api'// Ensure relative path matches your directory structure

// REQUIREMENT #4: Explicit status tracking
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: UserProfile | null;
  status: AuthStatus;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterPayload) => Promise<void>;
  forceLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const forceLogout = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const login = async (credentials: LoginPayload) => {
    setStatus('loading');
    try {
      const response = await loginUser(credentials);
      if (response && response.user) {
        setUser(response.user);
        setStatus('authenticated');
      } else {
      forceLogout();
        throw new Error(response?.error || 'Login failed');
      }
    } catch (error) {
     forceLogout();
      throw error;
    }
  };
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      forceLogout();
    }
  };

  const register = async (userData: RegisterPayload) => {
    await finalizeRegistration(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        register,
        forceLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};