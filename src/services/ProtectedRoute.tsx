import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../services/authcontext';

const ProtectedRoute = () => {
  const { status } = useAuth();


  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;