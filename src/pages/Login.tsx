import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Contex/AuthContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

// শুধু isAdmin: true token পেলে ভেতরে ঢুকতে দেয়। backend-এই admin
// কিনা তা যাচাই হয় (/verify-user-token) — client-side এর কোনো data
// (localStorage-এর user.email ইত্যাদি) বিশ্বাস করা হয় না।
const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { userToken } = useAuth();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    if (!userToken) {
      setStatus('denied');
      return;
    }

    fetch(`${import.meta.env.VITE_API}/verify-user-token`, {
      method: 'GET',
      headers: {
        'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        'Authorization': `Bearer ${userToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user?.isAdmin) {
          setStatus('allowed');
        } else {
          setStatus('denied');
        }
      })
      .catch(() => setStatus('denied'));
  }, [userToken]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;