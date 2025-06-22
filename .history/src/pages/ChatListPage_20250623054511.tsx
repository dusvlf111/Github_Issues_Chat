import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/ChatListPage.scss';

const ChatListPage: React.FC = () => {
  const { user, logout } = useAuth();

  // 임시 채팅방 데이터
  const chatRooms = [
    { id: '1', title: '일반 채팅', lastMessage: '안녕하세요!', timestamp: '2024-01-15' },
    { id: '2', title: '개발 논의', lastMessage: '새로운 기능을 추가해보겠습니다.', timestamp: '2024-01-14' },
  ];

  return (
    <div className="chat-list-page">
      <header className="chat-list-header">
        <h1>채팅방 목록</h1>
        <div className="user-info">
          {user && (
            <div className="user-profile">
              <img src={user.avatar_url} alt={user.login} className="user-avatar" />
              <span className="user-name">{user.name || user.login}</span>
            </div>
          )}
          <button onClick={logout} className="logout-btn">로그아웃</button>
        </div>
      </header>

      <div className="chat-list-content">
        {chatRooms.map((room) => (
          <Link key={room.id} to={`/chat/${room.id}`} className="chat-room-item">
            <div className="room-info">
              <h3 className="room-title">{room.title}</h3>
              <p className="room-last-message">{room.lastMessage}</p>
            </div>
            <div className="room-meta">
              <span className="room-timestamp">{room.timestamp}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage; 