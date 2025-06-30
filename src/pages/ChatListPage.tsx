import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { githubAPI } from '../services/api/github';
import type { ChatRoom } from '../types';
import Modal from '../components/common/Modal/Modal';
import ChatRoomForm from '../components/chat/ChatRoomForm/ChatRoomForm';
import Button from '../components/common/Button/Button';
import Loading from '../components/common/Loading/Loading';
import ErrorMessage from '../components/common/ErrorMessage/ErrorMessage';
import '../styles/pages/ChatListPage.scss';

const ChatListPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadChatRooms();
    }
  }, [token]);

  const loadChatRooms = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const rooms = await githubAPI.getChatRooms(token);
      setChatRooms(rooms);
    } catch (err) {
      console.error('채팅방 목록 로드 중 오류:', err);
      setError('채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (data: { title: string; body?: string }) => {
    if (!token) return;
    
    try {
      setFormLoading(true);
      
      // "chat" 라벨이 존재하는지 확인하고 없으면 생성
      await githubAPI.ensureChatLabel(token);
      
      const newRoom = await githubAPI.createChatRoom(token, data);
      setChatRooms(prev => [newRoom, ...prev]);
      setShowCreateModal(false);
      // 새로 생성된 채팅방으로 이동
      navigate(`/chat/${newRoom.number}`);
    } catch (err) {
      console.error('채팅방 생성 중 오류:', err);
      throw new Error('채팅방 생성에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditRoom = async (data: { title: string; body?: string }) => {
    if (!token || !selectedRoom) return;
    
    try {
      setFormLoading(true);
      const updatedRoom = await githubAPI.updateChatRoom(token, selectedRoom.number, data);
      setChatRooms(prev => 
        prev.map(room => 
          room.number === selectedRoom.number ? updatedRoom : room
        )
      );
      setShowEditModal(false);
      setSelectedRoom(null);
    } catch (err) {
      console.error('채팅방 수정 중 오류:', err);
      throw new Error('채팅방 수정에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!token || !selectedRoom) return;
    
    try {
      setFormLoading(true);
      await githubAPI.deleteChatRoom(token, selectedRoom.number);
      setChatRooms(prev => prev.filter(room => room.number !== selectedRoom.number));
      setShowDeleteModal(false);
      setSelectedRoom(null);
    } catch (err) {
      console.error('채팅방 삭제 중 오류:', err);
      alert('채팅방 삭제에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const openDeleteModal = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7일
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const canManageRoom = (room: ChatRoom) => {
    return user && room.user.login === user.login;
  };

  if (!user) {
    return (
      <div className="chat-list-page">
        <div className="auth-required">
          <p>로그인이 필요합니다.</p>
          <Link to="/login">로그인하기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list-page">
      <header className="chat-list-header">
        <h1>채팅방 목록</h1>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            새 채팅방 만들기
          </Button>
          <div className="user-info">
            <div className="user-profile">
              <img src={user.avatar_url} alt={user.login} className="user-avatar" />
              <span className="user-name">{user.name || user.login}</span>
            </div>
            <button onClick={logout} className="logout-btn">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="chat-list-content">
        {loading ? (
          <div className="loading-container">
            <Loading />
            <p>채팅방 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadChatRooms} />
        ) : chatRooms.length === 0 ? (
          <div className="empty-state">
            <p>아직 채팅방이 없습니다.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              첫 번째 채팅방 만들기
            </Button>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div key={room.number} className="chat-room-item">
              <Link to={`/chat/${room.number}`} className="room-link">
                <div className="room-info">
                  <div className="room-header">
                    <h3 className="room-title">{room.title}</h3>
                    {room.labels && room.labels.some(label => label.name === 'chat') && (
                      <span className="room-label chat-label">💬 채팅</span>
                    )}
                  </div>
                  <p className="room-last-message">
                    {room.lastMessage || '아직 메시지가 없습니다.'}
                  </p>
                  <div className="room-meta">
                    <span className="room-creator">@{room.user.login}</span>
                    <span className="room-timestamp">
                      {room.lastMessageTime ? formatDate(room.lastMessageTime) : formatDate(room.created_at)}
                    </span>
                    <span className="room-message-count">
                      {room.comments}개 메시지
                    </span>
                  </div>
                </div>
              </Link>
              
              {canManageRoom(room) && (
                <div className="room-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => openEditModal(room)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => openDeleteModal(room)}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 채팅방 생성 모달 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 채팅방 만들기"
      >
        <ChatRoomForm
          mode="create"
          onSubmit={handleCreateRoom}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* 채팅방 수정 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoom(null);
        }}
        title="채팅방 수정"
      >
        <ChatRoomForm
          mode="edit"
          initialData={selectedRoom ? {
            title: selectedRoom.title,
            body: selectedRoom.body,
          } : undefined}
          onSubmit={handleEditRoom}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedRoom(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* 채팅방 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRoom(null);
        }}
        title="채팅방 삭제"
        footer={
          <div className="modal-footer">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRoom(null);
              }}
              disabled={formLoading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRoom}
              disabled={formLoading}
            >
              {formLoading ? <Loading size="small" /> : '삭제'}
            </Button>
          </div>
        }
      >
        <div className="delete-confirmation">
          <p>
            <strong>"{selectedRoom?.title}"</strong> 채팅방을 삭제하시겠습니까?
          </p>
          <p>이 작업은 되돌릴 수 없으며, 모든 메시지가 함께 삭제됩니다.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ChatListPage; 