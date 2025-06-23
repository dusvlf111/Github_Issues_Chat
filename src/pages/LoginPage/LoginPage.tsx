import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.scss';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsLoading(true);
    try {
      await login(token.trim());
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('유효하지 않은 토큰입니다. 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setShowTokenInput(true);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>GitHub Issues Chat</h1>
          <p>GitHub Issues를 활용한 실시간 그룹채팅</p>
        </div>
        
        <div className="login-content">
          {!showTokenInput ? (
            <div className="login-options">
              <button 
                className="github-login-btn primary"
                onClick={handleQuickLogin}
              >
                <svg className="github-icon" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub로 로그인
              </button>
              
              <div className="login-info">
                <h3>💡 간편한 로그인</h3>
                <p>GitHub Personal Access Token을 입력하여 바로 채팅에 참여하세요!</p>
                <div className="features">
                  <span>🔐 안전한 GitHub 인증</span>
                  <span>💬 실시간 그룹채팅</span>
                  <span>📱 모바일 친화적</span>
                </div>
              </div>
            </div>
          ) : (
            <form className="token-form" onSubmit={handleTokenSubmit}>
              <div className="form-header">
                <h3>GitHub Personal Access Token</h3>
                <p>GitHub에서 발급받은 토큰을 입력해주세요</p>
              </div>
              
              <div className="input-group">
                <label htmlFor="token">Personal Access Token</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="token-input"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!token.trim() || isLoading}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </button>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => setShowTokenInput(false)}
                  disabled={isLoading}
                >
                  뒤로가기
                </button>
              </div>
              
              <div className="token-help">
                <h4>🔑 Personal Access Token 발급 방법</h4>
                <ol>
                  <li>GitHub.com → Settings → Developer settings</li>
                  <li>Personal access tokens → Tokens (classic)</li>
                  <li>Generate new token → Generate new token (classic)</li>
                  <li>권한 설정: <code>repo</code>, <code>user</code></li>
                  <li>토큰을 복사하여 위에 입력</li>
                </ol>
                <div className="warning">
                  ⚠️ 토큰은 안전하게 보관하고, 공개하지 마세요!
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;