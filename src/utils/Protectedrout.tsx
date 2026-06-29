import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Contex/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // user যে page-এ যেতে চেয়েছিল সেটা state-এ save করে login-এ পাঠাচ্ছি
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;