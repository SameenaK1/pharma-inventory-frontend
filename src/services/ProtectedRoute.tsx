import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../services/useAuth';

const ProtectedRoute = () => {
  const { status } = useAuth();


  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;