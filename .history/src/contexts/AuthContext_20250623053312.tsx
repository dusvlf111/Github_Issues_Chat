import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<AuthState>(initialState);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const savedToken = localStorage.getItem(APP_CONFIG.storage.authToken);
    if (savedToken) {
      dispatch({ type: 'LOGIN_START' });
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: null, token: savedToken } });
    }
  }, []);

  const login = async () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'repo';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem(APP_CONFIG.storage.authToken);
    localStorage.removeItem(APP_CONFIG.storage.userData);
    localStorage.removeItem(APP_CONFIG.storage.lastMessageId);
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};