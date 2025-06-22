import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage/LoginPage';
import ChatPage from '../pages/ChatPage/ChatPage';
import ProtectedRoute from '../components/auth/ProtectedRoute/ProtectedRoute';
import Loading from '../components/common/Loading/Loading';
import { APP_CONFIG } from '../config/app';

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
      {/* 로그인 페이지 - 인증되지 않은 사용자만 접근 */}
      <Route
        path={APP_CONFIG.routes.login}
        element={
          isAuthenticated ? (
            <Navigate to={APP_CONFIG.routes.chat} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* 채팅 페이지 - 인증된 사용자만 접근 */}
      <Route
        path={APP_CONFIG.routes.chat}
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* 존재하지 않는 경로 처리 */}
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? APP_CONFIG.routes.chat : APP_CONFIG.routes.login} replace />
        }
      />
    </Routes>
  );
};

export default AppRouter;