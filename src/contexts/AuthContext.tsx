import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { APP_CONFIG } from '../config/app';

interface User {
  id: number;
  login: string;
  name?: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // TODO: GitHub API로 사용자 정보 가져오기
    }
    setLoading(false);
  }, []);

  const login = () => {
    const clientId = APP_CONFIG.github.clientId;
    const redirectUri = APP_CONFIG.github.redirectUri;
    const scope = APP_CONFIG.github.scope;
    
    if (!clientId) {
      console.error('GitHub Client ID가 설정되지 않았습니다.');
      alert('GitHub OAuth 앱이 설정되지 않았습니다.');
      return;
    }
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    console.log('🔗 GitHub OAuth URL:', authUrl);
    window.location.href = authUrl;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('github_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};