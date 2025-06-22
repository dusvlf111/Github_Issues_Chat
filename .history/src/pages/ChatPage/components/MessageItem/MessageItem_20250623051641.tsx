import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../../../types';
import Avatar from '../../../../components/common/Avatar/Avatar';
import Button from '../../../../components/common/Button/Button';
import { APP_CONFIG } from '../../../../config/app';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 1분 미만
    if (diff < 60000) {
      return '방금 전';
    }
    
    // 1시간 미만
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}분 전`;
    }
    
    // 24시간 미만
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}시간 전`;
    }
    
    // 그 외
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div 
      className={`message-item ${isOwn ? 'message-item--own' : ''} ${isGrouped ? 'message-item--grouped' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 아바타 (그룹화되지 않은 경우에만 표시) */}
      {!isGrouped && !isOwn && (
        <div className="message-item__avatar">
          <Avatar
            src={message.author.avatar}
            alt={message.author.name || message.author.username}
            size="small"
          />
        </div>
      )}

      <div className="message-item__content">
        {/* 작성자 정보 (그룹화되지 않은 경우에만 표시) */}
        {!isGrouped && (
          <div className="message-item__header">
            <span className="message-item__author">
              {message.author.name || message.author.username}
            </span>
            <span className="message-item__time">
              {formatTime(message.timestamp)}
              {message.isEdited && (
                <span className="message-item__edited"> (편집됨)</span>
              )}
            </span>
          </div>
        )}

        {/* 메시지 본문 */}
        <div className="message-item__body">
          {isEditing ? (
            <div className="message-item__edit">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="message-item__edit-input"
                autoFocus
                rows={3}
              />
              <div className="message-item__edit-actions">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleEdit}
                  disabled={!editContent.trim()}
                >
                  저장
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleCancelEdit}
                >
                  취소
                </Button>
              </div>
              <p className="message-item__edit-tip">
                Ctrl+Enter로 저장, Esc로 취소
              </p>
            </div>
          ) : (
            <div className="message-item__text">
              {APP_CONFIG.chat.enableMarkdown ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <div className="message-item__plain-text">
                  {message.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 (본인 메시지에만 표시) */}
        {isOwn && showActions && !isEditing && (
          <div className="message-item__actions">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsEditing(true)}
              aria-label="메시지 수정"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={onDelete}
              aria-label="메시지 삭제"
            >
              🗑️
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => window.open(message.htmlUrl, '_blank')}
              aria-label="GitHub에서 보기"
            >
              🔗
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;