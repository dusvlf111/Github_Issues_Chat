import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRouter from './router/AppRouter';
import { validateGitHubAppConfig } from './config/github-app';
import './styles/globals.scss';

function App() {
  // 환경변수 검증
  React.useEffect(() => {
    const errors = validateGitHubAppConfig();
    if (errors.length > 0) {
      console.warn('Configuration warnings:', errors);
    }
  }, []);

  return (
    <BrowserRouter 
      basename={import.meta.env.BASE_URL || '/'}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <div className="app">
              <AppRouter />
            </div>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;