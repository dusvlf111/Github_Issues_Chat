import React from 'react';
import type { ChatMessage, GitHubUser } from '../../../../types';
import './MessageList.scss';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: GitHubUser | null;
  onEditMessage: (messageId: number, content: string) => void;
  onDeleteMessage: (messageId: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  onEditMessage,
  onDeleteMessage,
}) => {
  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <div className="message-list__empty-state">
          <div className="empty-state__icon">💬</div>
          <h3 className="empty-state__title">아직 메시지가 없습니다</h3>
          <p className="empty-state__description">
            첫 번째 메시지를 보내서 대화를 시작해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div className="message-list__container">
        {messages.map((message) => (
          <div key={message.id} className="message-item">
            <div className="message-item__content">
              {message.author && (
                <div className="message-item__header">
                  <span className="message-item__author">
                    {message.author.name || message.author.username}
                  </span>
                  <span className="message-item__time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="message-item__body">
                <div className="message-item__text">
                  {message.content}
                </div>
              </div>
              {currentUser && message.author?.id === currentUser.id && (
                <div className="message-item__actions">
                  <button onClick={() => onEditMessage(message.id, message.content)}>수정</button>
                  <button onClick={() => onDeleteMessage(message.id)}>삭제</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageList;