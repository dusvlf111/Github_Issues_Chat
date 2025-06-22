import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { GITHUB_APP_CONFIG } from '../config/github-app';
import { githubAppAPI } from '../services/api/github-app';
import type { GitHubUser } from '../types';

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const savedToken = localStorage.getItem('github_app_token');
    if (savedToken) {
      setTokenState(savedToken);
      setIsAuthenticated(true);
      refreshUser();
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const userData = await githubAppAPI.getUser(token);
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      // 토큰이 만료되었을 수 있으므로 로그아웃
      logout();
    }
  };

  const setToken = async (newToken: string) => {
    try {
      setTokenState(newToken);
      setIsAuthenticated(true);
      localStorage.setItem('github_app_token', newToken);
      
      // 토큰으로 사용자 정보 가져오기
      const userData = await githubAppAPI.getUser(newToken);
      setUser(userData);
    } catch (error) {
      console.error('토큰 설정 실패:', error);
      alert('유효하지 않은 토큰입니다.');
      logout();
    }
  };

  const login = () => {
    if (!GITHUB_APP_CONFIG.appId) {
      console.error('GitHub App ID가 설정되지 않았습니다.');
      alert('GitHub App이 설정되지 않았습니다.');
      return;
    }
    
    // GitHub App 설치 페이지로 리디렉션
    const installUrl = githubAppAPI.getInstallUrl();
    console.log('🔗 GitHub App 설치 URL:', installUrl);
    window.location.href = installUrl;
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    setIsAuthenticated(false);
    localStorage.removeItem('github_app_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, refreshUser, setToken }}>
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