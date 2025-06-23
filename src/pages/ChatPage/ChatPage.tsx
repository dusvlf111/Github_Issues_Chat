import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Header from '../../components/layout/Header/Header';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { state, sendMessage, refreshMessages } = useChat();
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('ChatPage useEffect - isAuthenticated:', isAuthenticated, 'loading:', loading);
    if (isAuthenticated) {
      console.log('Calling refreshMessages...');
      refreshMessages();
    } else {
      console.log('Not authenticated, skipping refreshMessages');
    }
  }, [isAuthenticated]);

  console.log('ChatPage render - messages:', state.messages, 'loading:', state.loading, 'error:', state.error, 'isAuthenticated:', isAuthenticated);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isAuthenticated) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-page">
        <div className="chat-page__unauthorized">
          <h2>로그인이 필요합니다</h2>
          <p>채팅에 참여하려면 먼저 로그인해주세요.</p>
          <div className="login-info">
            <p>💡 GitHub 계정으로 로그인하면 바로 채팅에 참여할 수 있습니다!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <Header />
      
      <div className="chat-page__content">
        <div className="chat-page__header">
          <h1>GitHub Issues Chat</h1>
          <p>실시간 그룹채팅에 참여하세요</p>
          <div className="chat-info">
            <span className="chat-status">🟢 온라인</span>
            <span className="participants">{state.messages.length > 0 ? `${state.messages.length}개의 메시지` : '새로운 채팅방'}</span>
            <button 
              onClick={() => {
                console.log('Manual refresh clicked');
                refreshMessages();
              }}
              style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="chat-page__chat-section">
          <div className="chat-messages">
            {state.messages.length === 0 ? (
              <div className="empty-messages">
                <div className="empty-icon">💬</div>
                <h3>아직 메시지가 없습니다</h3>
                <p>첫 번째 메시지를 보내보세요!</p>
                <div className="chat-features">
                  <span>🔐 GitHub 계정으로 안전한 로그인</span>
                  <span>💬 실시간 그룹채팅</span>
                  <span>📱 모바일 친화적</span>
                </div>
              </div>
            ) : (
              state.messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.isOwn ? 'message--own' : ''}`}>
                  <div className="message-avatar">
                    <img src={msg.author?.avatar || '/img/png/icon48.png'} alt={msg.author?.username || 'User'} />
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{msg.author?.username || 'Anonymous'}</span>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                    <div className="message-text">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="message-input-form" onSubmit={handleSendMessage}>
            <div className="input-wrapper">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="message-input"
                disabled={state.loading}
              />
              <button type="submit" className="send-btn" disabled={!message.trim() || state.loading}>
                {state.loading ? '전송 중...' : '전송'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;