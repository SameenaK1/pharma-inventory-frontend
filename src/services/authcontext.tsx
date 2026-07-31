import { createContext, useContext, useReducer, type ReactNode } from 'react';

export interface UserPayload {
  username: string;
  token: string;
}

export interface AuthState {
  user: UserPayload | null;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: UserPayload }
  | { type: 'LOGOUT' };

// 🌟 Added 'login' and 'logout' methods to the context type
interface AuthContextType extends AuthState {
  dispatch: (action: AuthAction) => void;
  login: (userData: UserPayload) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer remains pure: it ONLY handles React state
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload };
    case 'LOGOUT':
      return { user: null };
    default:
      return state;
  }
};

const initAuthState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user: UserPayload = JSON.parse(storedUser);
        return { user };
      } catch (error) {
        console.error("Failed to parse stored auth session:", error);
        localStorage.removeItem('user');
      }
    }
  }
  return { user: null };
};

interface AuthContextProviderProps {
  children: ReactNode; 
}

export const AuthProvider = ({ children }: AuthContextProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, { user: null }, initAuthState);

  // 🌟 NEW: Wrapper for login that handles storage AND state safely
  const login = (userData: UserPayload) => {
    localStorage.setItem('user', JSON.stringify(userData));
    dispatch({ type: 'LOGIN', payload: userData });
  };

  // 🌟 NEW: Wrapper for logout that destroys the token securely
  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    // Pass the new helper functions into the provider value
    <AuthContext.Provider value={{ ...state, dispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context; 
};