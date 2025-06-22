import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GitHubUser, AuthContextType, AuthState } from '../types';
import { githubAPI } from '../services/api/github';
import { APP_CONFIG } from '../config/app';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: GitHubUser; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: GitHubUser };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 컴포넌트 마운트 시 저장된 토큰 확인
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem(APP_CONFIG.storage.authToken);
      if (savedToken) {
        try {
          dispatch({ type: 'LOGIN_START' });
          
          // 사용자 정보 조회
          const user = await githubAPI.getUser(savedToken);
          
          // 저장소 접근 권한 확인
          const hasAccess = await githubAPI.checkRepositoryAccess(savedToken);
          if (!hasAccess) {
            throw new Error('저장소에 접근 권한이 없습니다.');
          }
          
          // 이슈 존재 여부 확인
          const issueExists = await githubAPI.checkIssueExists(savedToken);
          if (!issueExists) {
            throw new Error(`이슈 #${APP_CONFIG.github.issueNumber}을 찾을 수 없습니다.`);
          }
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: savedToken } });
        } catch (error) {
          console.error('Failed to restore auth:', error);
          localStorage.removeItem(APP_CONFIG.storage.authToken);
          localStorage.removeItem(APP_CONFIG.storage.userData);
          const errorMessage = error instanceof Error ? error.message : '인증 정보가 만료되었습니다.';
          dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (token: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // 사용자 정보 조회
      const user = await githubAPI.getUser(token);
      
      // 저장소 접근 권한 확인
      const hasAccess = await githubAPI.checkRepositoryAccess(token);
      if (!hasAccess) {
        throw new Error('이 저장소에 접근 권한이 없습니다. public_repo 권한이 필요합니다.');
      }
      
      // 이슈 존재 여부 확인
      const issueExists = await githubAPI.checkIssueExists(token);
      if (!issueExists) {
        throw new Error(`이슈 #${APP_CONFIG.github.issueNumber}을 찾을 수 없습니다. 먼저 이슈를 생성해주세요.`);
      }
      
      // 로컬 스토리지에 저장
      localStorage.setItem(APP_CONFIG.storage.authToken, token);
      localStorage.setItem(APP_CONFIG.storage.userData, JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = (): void => {
    // 로컬 스토리지 정리
    localStorage.removeItem(APP_CONFIG.storage.authToken);
    localStorage.removeItem(APP_CONFIG.storage.userData);
    localStorage.removeItem(APP_CONFIG.storage.lastMessageId);
    
    dispatch({ type: 'LOGOUT' });
  };

  const refreshUser = async (): Promise<void> => {
    if (!state.token) return;
    
    try {
      const user = await githubAPI.getUser(state.token);
      localStorage.setItem(APP_CONFIG.storage.userData, JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}