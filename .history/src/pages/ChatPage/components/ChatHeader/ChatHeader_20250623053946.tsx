import React from 'react';
import { ChatInfo } from '../../../../types/index';
import Button from '../../../../components/common/Button/Button';
import { APP_CONFIG } from '../../../../config/app';
import './ChatHeader.scss';

interface ChatHeaderProps {
  chatInfo: ChatInfo | null;
  isConnected: boolean;
  onRefresh: () => void;
  loading: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatInfo,
  isConnected,
  onRefresh,
  loading
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="chat-header">
      <div className="chat-header__info">
        <h2 className="chat-header__title">
          {chatInfo?.title || '채팅방'}
        </h2>
        
        {chatInfo?.description && (
          <p className="chat-header__description">
            {chatInfo.description}
          </p>
        )}
        
        <div className="chat-header__meta">
          <span className="chat-header__message-count">
            💬 {chatInfo?.messageCount || 0}개 메시지
          </span>
          
          <span className="chat-header__participants">
            👥 {chatInfo?.participants.length || 0}명 참여
          </span>
          
          {chatInfo?.createdAt && (
            <span className="chat-header__created">
              📅 {formatDate(chatInfo.createdAt)} 생성
            </span>
          )}
        </div>
      </div>

      <div className="chat-header__actions">
        {/* 연결 상태 표시 */}
        <div className={`chat-header__status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status__indicator"></span>
          <span className="status__text">
            {isConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>

        {/* 새로고침 버튼 */}
        <Button
          variant="ghost"
          size="small"
          onClick={onRefresh}
          loading={loading}
          disabled={loading}
          aria-label="메시지 새로고침"
        >
          🔄
        </Button>

        {/* GitHub에서 보기 버튼 */}
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            const url = `https://github.com/${APP_CONFIG.github.repository.owner}/${APP_CONFIG.github.repository.name}/issues/${APP_CONFIG.github.issueNumber}`;
            window.open(url, '_blank');
          }}
        >
          GitHub에서 보기
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;