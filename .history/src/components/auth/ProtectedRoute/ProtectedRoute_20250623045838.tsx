import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { APP_CONFIG } from '../../../config/app';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // 로딩은 AppRouter에서 처리
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_CONFIG.routes.login} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;