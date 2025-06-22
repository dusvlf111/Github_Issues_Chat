import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRouter from './router/AppRouter';
import { validateConfig } from './config/app';
import './styles/globals.scss';

function App() {
  // 환경변수 검증
  React.useEffect(() => {
    const errors = validateConfig();
    if (errors.length > 0) {
      console.error('Configuration errors:', errors);
    }
  }, []);

  return (
    <BrowserRouter basename="/">
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