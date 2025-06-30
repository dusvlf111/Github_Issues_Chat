import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { githubAppAPI } from '../services/api/github-app';
import type { GitHubUser } from '../types';

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token?: string) => void | Promise<void>;
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
    const initializeAuth = async () => {
      try {
        // 로컬 스토리지에서 토큰 확인
        const savedToken = localStorage.getItem('github_token');
        console.log('AuthContext useEffect - savedToken exists:', !!savedToken);
        console.log('AuthContext useEffect - savedToken length:', savedToken?.length || 0);
        
        if (savedToken) {
          console.log('Setting token and authenticating...');
          setTokenState(savedToken);
          setIsAuthenticated(true);
          
          // 토큰으로 사용자 정보 가져오기
          try {
            console.log('Fetching user data with saved token...');
            const userData = await githubAppAPI.getUser(savedToken);
            console.log('User data received:', userData);
            setUser(userData);
            console.log('User state updated successfully');
          } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
            // 토큰이 만료되었을 수 있으므로 로그아웃
            logout();
          }
        } else {
          console.log('No saved token found, user is not authenticated');
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        logout();
      } finally {
        console.log('AuthContext initialization completed, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
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
      console.log('setToken called with token length:', newToken.length);
      setTokenState(newToken);
      setIsAuthenticated(true);
      localStorage.setItem('github_token', newToken);
      console.log('Token saved to localStorage');
      
      // 토큰으로 사용자 정보 가져오기
      const userData = await githubAppAPI.getUser(newToken);
      console.log('User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('토큰 설정 실패:', error);
      alert('유효하지 않은 토큰입니다.');
      logout();
    }
  };

  const login = async (personalToken?: string) => {
    // Personal Access Token이 제공된 경우
    if (personalToken) {
      await setToken(personalToken);
      return;
    }

    // GitHub App 방식은 더 이상 지원하지 않음
    console.warn('GitHub App 방식은 더 이상 지원하지 않습니다. Personal Access Token을 사용해주세요.');
    alert('Personal Access Token을 입력해주세요.');
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    setIsAuthenticated(false);
    localStorage.removeItem('github_token');
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