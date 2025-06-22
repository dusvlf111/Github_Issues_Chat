import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { githubAppAPI } from '../../services/api/github-app';
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
        const installationId = searchParams.get('installation_id');
        const setupAction = searchParams.get('setup_action');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('GitHub App 설치 오류:', error, errorDescription);
          setError(errorDescription || 'GitHub App 설치 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }

        if (setupAction === 'install' && installationId) {
          // GitHub App 설치 완료
          console.log('✅ GitHub App 설치 완료:', installationId);
          
          // TODO: 서버에서 설치 토큰 생성
          // 현재는 임시로 설치 ID 저장
          localStorage.setItem('github_installation_id', installationId);
          
          // 성공적으로 설치 완료
          setLoading(false);
          navigate('/chat', { replace: true });
          
        } else if (setupAction === 'update') {
          // GitHub App 업데이트 완료
          console.log('✅ GitHub App 업데이트 완료');
          setLoading(false);
          navigate('/chat', { replace: true });
          
        } else {
          setError('알 수 없는 설치 상태입니다.');
          setLoading(false);
        }
        
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
        <Loading size="large" message="GitHub App 설치를 처리하고 있습니다..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-callback">
        <div className="auth-callback__error">
          <h2>설치 오류</h2>
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