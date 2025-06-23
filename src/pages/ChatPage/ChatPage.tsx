import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Header from '../../components/layout/Header/Header';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { state, sendMessage, refreshMessages, fetchIssueDetails } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('ChatPage useEffect - isAuthenticated:', isAuthenticated, 'loading:', loading);
    if (isAuthenticated) {
      console.log('Calling refreshMessages...');
      refreshMessages();
      fetchIssueDetails();
      inputRef.current?.focus();
    } else {
      console.log('Not authenticated, skipping refreshMessages');
    }
  }, [isAuthenticated]);

  console.log('ChatPage render - messages:', state.messages, 'loading:', state.loading, 'error:', state.error, 'isAuthenticated:', isAuthenticated);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isAuthenticated && !state.sending) {
      await sendMessage(message.trim());
      setMessage('');
      
      setTimeout(() => {
        refreshMessages();
      }, 100);
      
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 0);
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
      <Header title={state.issue?.title} />
      
      <div className="chat-page__content">
        <div className="chat-page__header">
          <h1>{state.issue?.title || 'GitHub Issues Chat'}</h1>
          <p>실시간 그룹채팅에 참여하세요</p>
        </div>

        <div className="chat-container">
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
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="floating-buttons">
            <button onClick={() => refreshMessages()} className="floating-btn" title="새로고침">
              ↻
            </button>
            <button onClick={scrollToBottom} className="floating-btn" title="맨 아래로">
              ↓
            </button>
          </div>
        </div>

        <form className="message-input-form" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={state.sending ? "전송 중..." : "메시지를 입력하세요 (Enter로 전송)"}
              className="message-input"
              disabled={state.sending}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;