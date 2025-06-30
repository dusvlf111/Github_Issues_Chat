import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { githubAPI } from '../../services/api/github';
import type { ChatRoom } from '../../types';
import Header from '../../components/layout/Header/Header';
import Button from '../../components/common/Button/Button';
import Loading from '../../components/common/Loading/Loading';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { issueNumber } = useParams<{ issueNumber: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { state, sendMessage, editMessage, deleteMessage, refreshMessages, fetchIssueDetails, setCurrentIssueNumber } = useChat();
  const [message, setMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 채팅방 정보 로드
  useEffect(() => {
    if (issueNumber && token) {
      loadChatRoom();
    }
  }, [issueNumber, token]);

  const loadChatRoom = async () => {
    if (!issueNumber || !token) return;
    
    try {
      setRoomLoading(true);
      setRoomError(null);
      
      // 먼저 이슈가 채팅방인지 확인
      const isChatRoom = await githubAPI.isChatRoom(token, parseInt(issueNumber));
      if (!isChatRoom) {
        setRoomError('이 이슈는 채팅방이 아닙니다. "chat" 라벨이 필요합니다.');
        return;
      }
      
      const room = await githubAPI.getChatRoom(token, parseInt(issueNumber));
      setChatRoom(room);
      
      // ChatContext에 현재 이슈 번호 설정
      setCurrentIssueNumber(parseInt(issueNumber));
      
      // 채팅방 정보를 가져온 후 메시지도 함께 로드
      if (isAuthenticated) {
        console.log('Loading messages after chat room load...');
        refreshMessages(parseInt(issueNumber));
        fetchIssueDetails(parseInt(issueNumber));
      }
    } catch (err) {
      console.error('채팅방 정보 로드 중 오류:', err);
      setRoomError('채팅방을 찾을 수 없습니다.');
    } finally {
      setRoomLoading(false);
    }
  };

  // 인증 상태가 변경될 때만 메시지 새로고침 (중복 방지)
  useEffect(() => {
    console.log('ChatPage useEffect - isAuthenticated:', isAuthenticated, 'loading:', authLoading);
    // 이미 loadChatRoom에서 메시지를 로드하므로 중복 호출 방지
    if (isAuthenticated && issueNumber && !roomLoading) {
      console.log('Focusing input after authentication...');
      inputRef.current?.focus();
    }
  }, [isAuthenticated, authLoading]);

  console.log('ChatPage render - messages:', state.messages, 'loading:', state.loading, 'error:', state.error, 'isAuthenticated:', isAuthenticated);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isAuthenticated && !state.sending && issueNumber) {
      await sendMessage(message.trim(), parseInt(issueNumber));
      setMessage('');
      
      setTimeout(() => {
        refreshMessages(parseInt(issueNumber));
      }, 100);
      
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 0);
    }
  };

  const handleEditMessage = (messageId: number, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
    setEditContent(currentContent);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;
    
    try {
      await editMessage(editingMessage.id, editContent.trim());
      setShowEditModal(false);
      setEditingMessage(null);
      setEditContent('');
      // 성공 피드백
      console.log('✅ 메시지가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('메시지 수정 실패:', error);
      alert('메시지 수정에 실패했습니다.');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('정말로 이 메시지를 삭제하시겠습니까?')) return;
    
    try {
      await deleteMessage(messageId);
      // 성공 피드백
      console.log('✅ 메시지가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
      alert('메시지 삭제에 실패했습니다.');
    }
  };

  const canEditMessage = (messageAuthorId: number) => {
    return user && messageAuthorId === user.id;
  };

  const canManageRoom = () => {
    return user && chatRoom && chatRoom.user.login === user.login;
  };

  const handleEditRoom = () => {
    navigate(`/chat/${issueNumber}/edit`);
  };

  const handleDeleteRoom = async () => {
    if (!token || !issueNumber || !confirm('정말로 이 채팅방을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await githubAPI.deleteChatRoom(token, parseInt(issueNumber));
      navigate('/');
    } catch (err) {
      console.error('채팅방 삭제 중 오류:', err);
      alert('채팅방 삭제에 실패했습니다.');
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

  if (roomLoading) {
    return (
      <div className="chat-page">
        <div className="loading-container">
          <Loading />
          <p>채팅방을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (roomError || !chatRoom) {
    return (
      <div className="chat-page">
        <div className="error-container">
          <ErrorMessage 
            message={roomError || '채팅방을 찾을 수 없습니다.'} 
            onRetry={loadChatRoom}
          />
          <Button variant="primary" onClick={() => navigate('/')}>
            채팅방 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <Header title={chatRoom.title} />
      
      <div className="chat-page__content">
        <div className="chat-page__header">
          <div className="room-info">
            <h1>{chatRoom.title}</h1>
            {chatRoom.body && <p className="room-description">{chatRoom.body}</p>}
            <div className="room-meta">
              <span className="room-creator">@{chatRoom.user.login}</span>
              <span className="room-created">
                {new Date(chatRoom.created_at).toLocaleDateString('ko-KR')} 생성
              </span>
              <span className="room-message-count">
                {chatRoom.comments}개 메시지
              </span>
            </div>
          </div>
          
          {canManageRoom() && (
            <div className="room-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={handleEditRoom}
              >
                수정
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={handleDeleteRoom}
              >
                삭제
              </Button>
            </div>
          )}
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
                        <span className="message-time">
                          {msg.timestamp}
                          {msg.isEdited && <span className="message-edited"> (수정됨)</span>}
                        </span>
                      </div>
                      <div className="message-text">{msg.content}</div>
                      {canEditMessage(msg.author?.id || 0) && (
                        <div className="message-actions">
                          <button 
                            className="message-action-btn message-action-btn--edit"
                            onClick={() => handleEditMessage(msg.id, msg.content)}
                            title="메시지 수정"
                          >
                            ✏️
                          </button>
                          <button 
                            className="message-action-btn message-action-btn--delete"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="메시지 삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="floating-buttons">
            <button onClick={() => issueNumber && refreshMessages(parseInt(issueNumber))} className="floating-btn" title="새로고침">
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

      {/* 메시지 수정 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMessage(null);
          setEditContent('');
        }}
        title="메시지 수정"
      >
        <div className="edit-message-modal">
          <Input
            type="textarea"
            value={editContent}
            onChange={(value) => setEditContent(value)}
            placeholder="메시지를 입력하세요"
            rows={4}
          />
          <div className="edit-message-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingMessage(null);
                setEditContent('');
              }}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
            >
              수정
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;