import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../services/authcontext';

const ProtectedRoute = () => {
  const { status } = useAuth();

  // REQUIREMENT #5: Wait for auth bootstrap before making redirection decisions
  if (status === 'loading') {
    return <div>Loading session...</div>; // Render your Spinner/Skeleton loader here
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;