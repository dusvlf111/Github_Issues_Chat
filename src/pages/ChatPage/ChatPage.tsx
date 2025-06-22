import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Header from '../../components/layout/Header/Header';
import UtterancesComments from '../../components/UtterancesComments';
import { UTTERANCES_CONFIG } from '../../config/utterances';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { state, sendMessage, refreshMessages } = useChat();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      refreshMessages();
    }
  }, [isAuthenticated, refreshMessages]);

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
          <p>실시간 채팅에 참여하세요</p>
        </div>

        <div className="chat-page__chat-section">
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

        <div className="chat-page__comments-section">
          <h2>댓글 (GitHub Issues)</h2>
          <p className="comments-description">
            아래 댓글은 GitHub Issues와 연동됩니다. GitHub 계정으로 로그인하여 댓글을 남겨보세요!
          </p>
          <UtterancesComments
            repo={UTTERANCES_CONFIG.repo}
            issueTerm={UTTERANCES_CONFIG.issueTerm}
            label={UTTERANCES_CONFIG.label}
            theme={UTTERANCES_CONFIG.theme}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;