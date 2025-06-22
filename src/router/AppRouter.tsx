import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage/LoginPage';
import ChatPage from '../pages/ChatPage/ChatPage';
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
        element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />} 
      />
      <Route 
        path="/chat" 
        element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRouter;