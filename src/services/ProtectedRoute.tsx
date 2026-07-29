import { Navigate, Outlet } from 'react-router';
// 🌟 Pointing directly to your context file inside the services folder
import { useAuth } from './authcontext';

export function ProtectedRoute() {
  // 🌟 FIX: Extract 'user' directly instead of 'state'
  const { user } = useAuth();

  // 1. Check current application context state first
  let token: string | null | undefined = user?.token;

  // 2. Hydration fallback: Check localStorage if context state isn't populated yet
  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        token = parsed?.token || null;
      } catch {
        token = null;
      }
    }
  }

  // 3. Kick unauthenticated sessions back to the login page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 4. Authorized -> Render the client-side routes
  return <Outlet />;
}