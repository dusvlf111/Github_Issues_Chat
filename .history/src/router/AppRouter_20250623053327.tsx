import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import ChatListPage from '../pages/ChatListPage';
import ChatRoomPage from '../pages/ChatRoomPage';

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/chats" replace /> : <LoginPage />} 
      />
      <Route 
        path="/chats" 
        element={isAuthenticated ? <ChatListPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/chat/:roomId" 
        element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/chats" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRouter;