import React from 'react';
import type { ChatMessage } from '../../../../types';
import './MessageItem.scss';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  isGrouped: boolean;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  isGrouped,
  onEdit,
  onDelete,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`message-item ${isOwn ? 'message-item--own' : ''} ${isGrouped ? 'message-item--grouped' : ''}`}>
      <div className="message-item__content">
        {!isGrouped && message.author && (
          <div className="message-item__header">
            <span className="message-item__author">
              {message.author.name || message.author.username}
            </span>
            <span className="message-item__time">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        <div className="message-item__body">
          <div className="message-item__text">
            {message.content}
          </div>
        </div>

        {isOwn && (
          <div className="message-item__actions">
            <button onClick={() => onEdit(message.content)}>수정</button>
            <button onClick={onDelete}>삭제</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;