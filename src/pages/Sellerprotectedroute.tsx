import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface SellerProtectedRouteProps {
  children: ReactNode;
}

const SellerProtectedRoute = ({ children }: SellerProtectedRouteProps) => {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('sellerToken');
    if (!token) {
      setStatus('denied');
      return;
    }

    fetch(`${import.meta.env.VITE_API}/seller/verify-token`, {
      method: 'GET',
      headers: {
        'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        'Authorization': `Bearer ${token}`,   // 👈 password/email এর বদলে শুধু token
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('allowed');
        } else {
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('seller');
          setStatus('denied');
        }
      })
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/seller/login" replace />;
  }

  return <>{children}</>;
};

export default SellerProtectedRoute;