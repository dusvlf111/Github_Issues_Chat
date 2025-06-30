import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { githubAPI } from '../../services/api/github';
import type { ChatRoom } from '../../types';
import Header from '../../components/layout/Header/Header';
import ChatRoomForm from '../../components/chat/ChatRoomForm/ChatRoomForm';
import Loading from '../../components/common/Loading/Loading';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import './ChatEditPage.scss';

const ChatEditPage: React.FC = () => {
  const { issueNumber } = useParams<{ issueNumber: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (issueNumber && token) {
      loadChatRoom();
    }
  }, [issueNumber, token]);

  const loadChatRoom = async () => {
    if (!issueNumber || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const room = await githubAPI.getChatRoom(token, parseInt(issueNumber));
      setChatRoom(room);
      
      // 본인이 만든 채팅방인지 확인
      if (user && room.user.login !== user.login) {
        setError('본인이 만든 채팅방만 수정할 수 있습니다.');
      }
    } catch (err) {
      console.error('채팅방 정보 로드 중 오류:', err);
      setError('채팅방을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (data: { title: string; body?: string }) => {
    if (!token || !issueNumber) return;
    
    try {
      setFormLoading(true);
      await githubAPI.updateChatRoom(token, parseInt(issueNumber), data);
      navigate(`/chat/${issueNumber}`);
    } catch (err) {
      console.error('채팅방 수정 중 오류:', err);
      throw new Error('채팅방 수정에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/chat/${issueNumber}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-edit-page">
        <div className="auth-required">
          <h2>로그인이 필요합니다</h2>
          <p>채팅방을 수정하려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chat-edit-page">
        <div className="loading-container">
          <Loading />
          <p>채팅방 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !chatRoom) {
    return (
      <div className="chat-edit-page">
        <div className="error-container">
          <ErrorMessage 
            message={error || '채팅방을 찾을 수 없습니다.'} 
            onRetry={loadChatRoom}
          />
          <button onClick={() => navigate('/')} className="back-btn">
            채팅방 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-edit-page">
      <Header title="채팅방 수정" />
      
      <div className="chat-edit-content">
        <div className="edit-header">
          <h1>채팅방 수정</h1>
          <p>"{chatRoom.title}" 채팅방의 정보를 수정할 수 있습니다.</p>
        </div>

        <div className="edit-form-container">
          <ChatRoomForm
            mode="edit"
            initialData={{
              title: chatRoom.title,
              body: chatRoom.body,
            }}
            onSubmit={handleUpdateRoom}
            onCancel={handleCancel}
            loading={formLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatEditPage; 