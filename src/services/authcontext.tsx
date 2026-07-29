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

// 🌟 Flat Context Structure: 'user' and 'dispatch' live at the root level
interface AuthContextType extends AuthState {
  dispatch: (action: AuthAction) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

// 🌟 Modern Practice: Synchronous initializer solves client-side auth flickering entirely
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
  // ReactNode is the modern standard to allow strings, fragments, arrays, and conditional expressions cleanly
  children: ReactNode; 
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  // Pass initAuthState as the 3rd argument to load the user string before components mount
  const [state, dispatch] = useReducer(authReducer, { user: null }, initAuthState);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🌟 Combined Hook: Exported directly from your services file to simplify architecture
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context; // Instantly returns { user, dispatch }
};