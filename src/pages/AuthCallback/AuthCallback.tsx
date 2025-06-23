import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthCallback.scss';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, isAuthenticated } = useAuth();
  const [token, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 인증된 경우 채팅 페이지로 리디렉션
    if (isAuthenticated) {
      navigate('/chat');
      return;
    }

    // URL에서 코드 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      // GitHub App OAuth 콜백 처리 (기존 방식)
      handleOAuthCallback(code, state);
    }
  }, [isAuthenticated, navigate]);

  const handleOAuthCallback = async (code: string, state: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      // GitHub App 설치 토큰 생성 로직
      // (기존 GitHub App 방식 유지)
      console.log('GitHub App OAuth 콜백 처리:', { code, state });
      
      // 임시로 Personal Access Token 입력 방식으로 안내
      setError('GitHub App 설정이 완료되지 않았습니다. Personal Access Token을 사용해주세요.');
    } catch (error) {
      console.error('OAuth 콜백 처리 실패:', error);
      setError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await setToken(token.trim());
      navigate('/chat');
    } catch (error) {
      console.error('토큰 설정 실패:', error);
      setError('유효하지 않은 토큰입니다. 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-callback">
      <div className="callback-container">
        <div className="callback-header">
          <h1>🔐 인증</h1>
          <p>GitHub 계정으로 로그인하여 채팅에 참여하세요</p>
        </div>

        {isLoading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>인증 처리 중...</p>
          </div>
        ) : error ? (
          <div className="error-section">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
            
            <form className="token-form" onSubmit={handleTokenSubmit}>
              <div className="form-header">
                <h3>Personal Access Token으로 로그인</h3>
                <p>GitHub에서 발급받은 토큰을 입력해주세요</p>
              </div>
              
              <div className="input-group">
                <label htmlFor="token">Personal Access Token</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="token-input"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={!token.trim() || isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        ) : (
          <div className="success-section">
            <div className="success-message">
              <span className="success-icon">✅</span>
              <h3>인증 성공!</h3>
              <p>채팅 페이지로 이동합니다...</p>
            </div>
          </div>
        )}

        <div className="callback-footer">
          <a href="/" className="back-link">← 홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 