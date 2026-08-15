import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import {
  getCurrentUserProfile,
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // REQUIREMENT #3: Bootstrap session state from /user/profile
  const bootstrapAuth = useCallback(async () => {
    const hasSession = document.cookie.split('; ').some(row => row.startsWith('has_session='));

  // If no session cookie exists, skip calling getCurrentUserProfile completely!
  if (!hasSession) {
    setUser(null);
    setStatus('unauthenticated');
    return;
  }
    try {
      const response = await getCurrentUserProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      // Cookie is missing, expired, or invalid
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  // Run initial session check on app load / page refresh
  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // REQUIREMENT #6: Login flow without touching localStorage
  const login = async (credentials: LoginPayload) => {
    // 1. Trigger backend login endpoint (sets HttpOnly cookie)
    await loginUser(credentials);

    // 2. Immediately bootstrap session to populate profile data
    const profileResponse = await getCurrentUserProfile();
    if (profileResponse.success && profileResponse.data) {
      setUser(profileResponse.data);
      setStatus('authenticated');
    } else {
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  // REQUIREMENT #7: Logout clears server cookie and resets frontend state
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      // REQUIREMENT #2: No localStorage to clear, just reset React state
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  // REQUIREMENT #9: Registration flow without breaking session bootstrap
  const register = async (userData: RegisterPayload) => {
    await finalizeRegistration(userData);
    
    // If registration logs the user in automatically on backend, fetch profile:
    try {
      const profileResponse = await getCurrentUserProfile();
      if (profileResponse.success && profileResponse.data) {
        setUser(profileResponse.data);
        setStatus('authenticated');
      }
    } catch {
      // If registration requires separate manual login, user remains unauthenticated
      setStatus('unauthenticated');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        register,
        refreshProfile: bootstrapAuth,
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