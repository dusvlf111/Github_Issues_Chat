import React from 'react';
import { ChatMessage, GitHubUser } from '../../../../types';
import MessageItem from '../MessageItem/MessageItem';
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
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const isGrouped = prevMessage && 
            prevMessage.author.id === message.author.id &&
            new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() < 5 * 60 * 1000; // 5분 이내

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={currentUser ? message.author.id === currentUser.id : false}
              isGrouped={isGrouped}
              onEdit={(content) => onEditMessage(message.id, content)}
              onDelete={() => onDeleteMessage(message.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;