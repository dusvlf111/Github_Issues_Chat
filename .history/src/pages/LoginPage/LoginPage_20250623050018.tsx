import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button/Button';
import { APP_CONFIG } from '../../config/app';
import './LoginPage.scss';

const LoginPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsSubmitting(true);
    try {
      await login(token.trim());
      navigate(APP_CONFIG.routes.chat, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const repoInfo = `${APP_CONFIG.github.repository.owner}/${APP_CONFIG.github.repository.name}`;
  const issueNumber = APP_CONFIG.github.issueNumber;

  return (
    <div className="login-page">
      <div className="login-page__container">
        {/* 왼쪽: 웰컴 섹션 */}
        <div className="login-page__welcome">
          <div className="welcome__content">
            <h1 className="welcome__title">
              GitHub Issues Chat
            </h1>
            <p className="welcome__subtitle">
              {repoInfo} 저장소의 이슈 #{issueNumber}을 채팅방으로 사용합니다
            </p>
            
            <div className="welcome__features">
              <div className="feature">
                <div className="feature__icon">💬</div>
                <div className="feature__text">
                  <h3>실시간 채팅</h3>
                  <p>GitHub Issues 댓글을 활용한 채팅</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature__icon">🔒</div>
                <div className="feature__text">
                  <h3>GitHub 인증</h3>
                  <p>Personal Access Token으로 안전한 로그인</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature__icon">📱</div>
                <div className="feature__text">
                  <h3>PWA 지원</h3>
                  <p>모바일 앱처럼 설치 및 사용 가능</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature__icon">✨</div>
                <div className="feature__text">
                  <h3>마크다운 지원</h3>
                  <p>GitHub Flavored Markdown 완전 지원</p>
                </div>
              </div>
            </div>

            <div className="welcome__repo-info">
              <h4>채팅방 정보:</h4>
              <div className="repo-info__item">
                <span className="label">저장소:</span>
                <a 
                  href={`https://github.com/${repoInfo}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="value link"
                >
                  {repoInfo}
                </a>
              </div>
              <div className="repo-info__item">
                <span className="label">이슈:</span>
                <a 
                  href={`https://github.com/${repoInfo}/issues/${issueNumber}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="value link"
                >
                  #{issueNumber}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 로그인 폼 */}
        <div className="login-page__form">
          <div className="login-form">
            <div className="login-form__header">
              <h2>로그인</h2>
              <p>GitHub Personal Access Token으로 시작하세요</p>
            </div>

            {error && (
              <div className="login-form__error">
                <span className="error__icon">⚠️</span>
                <span className="error__message">{error}</span>
              </div>
            )}

            {/* Personal Access Token 입력 */}
            <form onSubmit={handleTokenLogin} className="token-form">
              <div className="token-form__field">
                <label htmlFor="token">Personal Access Token</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="token-form__input"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isSubmitting}
                disabled={!token.trim() || isSubmitting}
              >
                로그인
              </Button>
            </form>

            <div className="login-form__info">
              <h4>토큰 생성 방법:</h4>
              <ol>
                <li>
                  <a 
                    href="https://github.com/settings/tokens/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    GitHub Settings → Personal Access Tokens
                  </a>
                </li>
                <li><strong>public_repo</strong> 권한 선택</li>
                <li><strong>user:email</strong> 권한 선택</li>
                <li>토큰 생성 후 복사하여 위에 입력</li>
              </ol>
              
              <div className="info__permissions">
                <h5>필요한 권한:</h5>
                <ul>
                  <li><code>public_repo</code> - 저장소 이슈/댓글 접근</li>
                  <li><code>user:email</code> - 사용자 정보 조회</li>
                </ul>
              </div>

              <p className="info__note">
                토큰은 브라우저에만 저장되며 안전하게 보호됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;