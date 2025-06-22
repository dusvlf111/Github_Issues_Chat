import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading/Loading';
import './AuthCallback.scss';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('OAuth Error:', error, errorDescription);
          setError(errorDescription || '인증 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }

        if (!code) {
          setError('인증 코드를 받지 못했습니다.');
          setLoading(false);
          return;
        }

        // TODO: 서버에서 액세스 토큰 교환
        // 현재는 임시로 로컬 스토리지에 코드 저장
        localStorage.setItem('github_auth_code', code);
        
        // 성공적으로 인증 완료
        setLoading(false);
        navigate('/chat', { replace: true });
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="auth-callback">
        <Loading size="large" message="인증을 처리하고 있습니다..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-callback">
        <div className="auth-callback__error">
          <h2>인증 오류</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="auth-callback__retry-btn"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 