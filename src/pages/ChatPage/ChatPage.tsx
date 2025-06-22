import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { state } = useChat();
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: 메시지 전송 로직 구현
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header__info">
          <h1>GitHub Issues Chat</h1>
          <p>실시간 채팅</p>
        </div>
        <div className="chat-header__user">
          {user && (
            <div className="user-profile">
              <img src={user.avatar_url} alt={user.login} className="user-avatar" />
              <span className="user-name">{user.name || user.login}</span>
            </div>
          )}
          <button onClick={logout} className="logout-btn">로그아웃</button>
        </div>
      </header>

      <div className="chat-content">
        <div className="chat-messages">
          {state.messages.length === 0 ? (
            <div className="empty-messages">
              <p>아직 메시지가 없습니다.</p>
              <p>첫 번째 메시지를 보내보세요!</p>
            </div>
          ) : (
            state.messages.map((msg) => (
              <div key={msg.id} className="message">
                <div className="message-content">{msg.content}</div>
                <div className="message-meta">
                  <span className="message-author">{msg.author?.username}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="message-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="message-input"
          />
          <button type="submit" className="send-btn" disabled={!message.trim()}>
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;