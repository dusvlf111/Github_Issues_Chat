import React, { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layout/Header/Header';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import MessageInput from './components/MessageInput/MessageInput';
import Loading from '../../components/common/Loading/Loading';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { APP_CONFIG } from '../../config/app';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { 
    messages, 
    chatInfo, 
    loading, 
    error, 
    isConnected,
    sendMessage, 
    editMessage, 
    deleteMessage,
    refreshMessages,
    startRealtimeUpdates,
    stopRealtimeUpdates
  } = useChat();
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  };

  // 새 메시지가 추가되면 자동 스크롤 (사용자가 맨 아래에 있을 때만)
  useEffect(() => {
    if (APP_CONFIG.chat.autoScroll && isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // 실시간 업데이트 시작
  useEffect(() => {
    startRealtimeUpdates();
    return () => stopRealtimeUpdates();
  }, [startRealtimeUpdates, stopRealtimeUpdates]);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px 여유
      setIsAtBottom(isBottom);
    };

    const messageContainer = document.querySelector('.message-list');
    messageContainer?.addEventListener('scroll', handleScroll);
    
    return () => {
      messageContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      await editMessage(messageId, content);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleRefresh = () => {
    refreshMessages();
  };

  if (loading && messages.length === 0) {
    return (
      <div className="chat-page">
        <Header />
        <div className="chat-page__loading">
          <Loading size="large" message="채팅방을 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <Header />
      
      <div className="chat-page__container">
        {/* 채팅방 헤더 */}
        <ChatHeader 
          chatInfo={chatInfo}
          isConnected={isConnected}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* 에러 표시 */}
        {error && (
          <div className="chat-page__error">
            <ErrorMessage 
              message={error} 
              onRetry={handleRefresh}
            />
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="chat-page__content">
          <MessageList
            messages={messages}
            currentUser={user}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
          
          {/* 스크롤 맨 아래 마커 */}
          <div ref={messagesEndRef} />
          
          {/* 맨 아래로 스크롤 버튼 */}
          {!isAtBottom && (
            <button 
              className="chat-page__scroll-to-bottom"
              onClick={() => scrollToBottom()}
              aria-label="맨 아래로 스크롤"
            >
              ↓
            </button>
          )}
        </div>

        {/* 메시지 입력창 */}
        <div className="chat-page__input">
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={!isConnected}
            placeholder={
              isConnected 
                ? "메시지를 입력하세요... (Markdown 지원)"
                : "연결 중..."
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;