import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, ThemeContextType } from '../types';
import { APP_CONFIG } from '../config/app';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(APP_CONFIG.storage.themeMode) as ThemeMode;
    return saved || 'light';
  });

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;
    
    if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }, [mode]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem(APP_CONFIG.storage.themeMode, newMode);
  };

  const toggleTheme = () => {
    setTheme(mode === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    mode,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}