import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../common/Button/Button';
import Avatar from '../../common/Avatar/Avatar';
import { APP_CONFIG } from '../../../config/app';
import './Header.scss';
import { useNavigate } from 'react-router-dom';

import sunIcon from '/img/png/sun.png';
import moonIcon from '/img/png/moon.png';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('정말로 로그아웃하시겠습니까?')) {
      logout();
    }
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* 로고 영역 */}
        <div className="header__brand">
          <h1 className="header__title" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>GitHub Issue Chat</h1>
        </div>

        {/* 사용자 메뉴 */}
        <div className="header__menu">
          {/* 테마 토글 */}
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            aria-label="테마 변경"
            className="header__theme-toggle"
          >
            <img 
              src={theme === 'dark' ? sunIcon : moonIcon} 
              alt="테마 변경 아이콘" 
              className="header__theme-icon"
            />
          </Button>

          {/* 사용자 정보 */}
          {user && (
            <div className="header__user">
              <Avatar
                src={user.avatar_url}
                alt={user.name || user.login}
                size="small"
              />
              <span className="header__username">
                {user.name || user.login}
              </span>
            </div>
          )}

          {/* 로그아웃 버튼 */}
          <Button
            variant="secondary"
            size="small"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;