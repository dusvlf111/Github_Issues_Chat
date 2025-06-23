import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRouter from './router/AppRouter';
import './styles/globals.scss';

function App() {
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