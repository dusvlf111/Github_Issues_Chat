import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage/LoginPage';
import ChatListPage from '../pages/ChatListPage';
import ChatPage from '../pages/ChatPage/ChatPage';
import ChatEditPage from '../pages/ChatEditPage/ChatEditPage';
import AuthCallback from '../pages/AuthCallback/AuthCallback';
import ProtectedRoute from '../components/auth/ProtectedRoute/ProtectedRoute';
import Loading from '../components/common/Loading/Loading';

const AppRouter: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // 인증 상태 로딩 중일 때
  if (loading) {
    return (
      <div className="app__loading">
        <Loading size="large" message="앱을 초기화하고 있습니다..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <ChatListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat/:issueNumber" 
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat/:issueNumber/edit" 
        element={
          <ProtectedRoute>
            <ChatEditPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/auth/callback" 
        element={<AuthCallback />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRouter;