import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading/Loading';
import './AuthCallback.scss';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const installationId = searchParams.get('installation_id');
      const setupAction = searchParams.get('setup_action');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('GitHub App 설치 오류:', error, errorDescription);
        setError(errorDescription || 'GitHub App 설치 중 오류가 발생했습니다.');
        return;
      }

      if (setupAction === 'install' && installationId) {
        // GitHub App 설치 완료
        console.log('✅ GitHub App 설치 완료:', installationId);
        localStorage.setItem('github_installation_id', installationId);
        
        // 설치 완료 후 토큰 입력 페이지 표시
        setLoading(false);
      } else if (setupAction === 'update') {
        // GitHub App 업데이트 완료
        console.log('✅ GitHub App 업데이트 완료');
        setLoading(false);
      } else {
        setError('알 수 없는 설치 상태입니다.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('토큰을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setToken(tokenInput.trim());
      navigate('/chat', { replace: true });
    } catch (err) {
      setError('토큰이 유효하지 않습니다. 다시 확인해주세요.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-callback">
        <Loading size="large" message="GitHub App 설치를 처리하고 있습니다..." />
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback__container">
        <h2>GitHub Personal Access Token 입력</h2>
        <p>
          GitHub App 설치가 완료되었습니다. 이제 Personal Access Token을 입력하여 채팅에 참여하세요.
        </p>
        
        <div className="auth-callback__instructions">
          <h3>Personal Access Token 생성 방법:</h3>
          <ol>
            <li>GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
            <li>Generate new token → Generate new token (classic)</li>
            <li>Note: "GitHub Issues Chat"</li>
            <li>Expiration: 90 days (또는 원하는 기간)</li>
            <li>Select scopes: <strong>repo</strong> (전체 저장소 접근)</li>
            <li>Generate token 클릭</li>
            <li>생성된 토큰을 아래에 입력</li>
          </ol>
        </div>

        <form onSubmit={handleTokenSubmit} className="auth-callback__form">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="auth-callback__token-input"
            required
          />
          <button 
            type="submit" 
            className="auth-callback__submit-btn"
            disabled={loading}
          >
            {loading ? '확인 중...' : '토큰 확인'}
          </button>
        </form>

        {error && (
          <div className="auth-callback__error">
            <p>{error}</p>
          </div>
        )}

        <button 
          onClick={() => navigate('/login')}
          className="auth-callback__back-btn"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default AuthCallback; 