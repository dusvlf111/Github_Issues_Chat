import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/ChatRoomPage.scss';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { state } = useChat();
  const { user } = useAuth();
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
    <div className="chat-room-page">
      <header className="chat-room-header">
        <Link to="/chats" className="back-btn">← 뒤로</Link>
        <h2>채팅방 {roomId}</h2>
        <div className="room-actions">
          <button className="room-settings-btn">⚙️</button>
        </div>
      </header>

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
  );
};

export default ChatRoomPage; 