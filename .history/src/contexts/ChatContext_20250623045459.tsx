import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { ChatContextType, ChatState, ChatMessage, ChatInfo, GitHubComment, GitHubIssue } from '../types';
import { githubAPI } from '../services/api/github';
import { useAuth } from './AuthContext';
import { APP_CONFIG } from '../config/app';

type ChatAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_END' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: ChatMessage }
  | { type: 'REMOVE_MESSAGE'; payload: number }
  | { type: 'SET_CHAT_INFO'; payload: ChatInfo }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LAST_UPDATED'; payload: string };

const initialState: ChatState = {
  messages: [],
  chatInfo: null,
  loading: false,
  error: null,
  isConnected: false,
  lastUpdated: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'LOADING_START':
      return { ...state, loading: true, error: null };
    case 'LOADING_END':
      return { ...state, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? action.payload : msg
        ),
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };
    case 'SET_CHAT_INFO':
      return { ...state, chatInfo: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token, isAuthenticated } = useAuth();
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // GitHub 댓글을 ChatMessage로 변환
  const transformComment = useCallback((comment: GitHubComment): ChatMessage => {
    return {
      id: comment.id,
      content: comment.body,
      timestamp: comment.created_at,
      editedAt: comment.updated_at !== comment.created_at ? comment.updated_at : null,
      author: {
        id: comment.user.id,
        username: comment.user.login,
        avatar: comment.user.avatar_url,
        name: comment.user.name || undefined,
      },
      isEdited: comment.updated_at !== comment.created_at,
      isOwn: user ? comment.user.id === user.id : false,
      htmlUrl: comment.html_url,
    };
  }, [user]);

  // GitHub 이슈를 ChatInfo로 변환
  const transformIssue = useCallback((issue: GitHubIssue): ChatInfo => {
    // 참여자 목록은 실제로는 더 복잡한 로직이 필요하지만 여기서는 간단히 처리
    const participants = [issue.user];
    
    return {
      title: issue.title,
      description: issue.body,
      messageCount: issue.comments,
      participants,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
  }, []);

  // 메시지 목록 조회
  const refreshMessages = useCallback(async () => {
    if (!token) return;

    try {
      dispatch({ type: 'LOADING_START' });
      
      // 이슈 정보와 댓글 병렬 조회
      const [issue, comments] = await Promise.all([
        githubAPI.getChatIssue(token),
        githubAPI.getMessages(token, { per_page: 100 }),
      ]);

      const chatInfo = transformIssue(issue);
      const messages = comments.map(transformComment);

      dispatch({ type: 'SET_CHAT_INFO', payload: chatInfo });
      dispatch({ type: 'SET_MESSAGES', payload: messages });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
      
      // 마지막 메시지 ID 업데이트
      localStorage.setItem(APP_CONFIG.storage.lastMessageId, String(message.id));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [token, transformComment]);

  // 메시지 수정
  const editMessage = useCallback(async (messageId: number, content: string) => {
    if (!token) throw new Error('로그인이 필요합니다.');

    try {
      const comment = await githubAPI.editMessage(token, messageId, content);
      const message = transformComment(comment);
      dispatch({ type: 'UPDATE_MESSAGE', payload: message });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 수정에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [token, transformComment]);

  // 메시지 삭제
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!token) throw new Error('로그인이 필요합니다.');

    try {
      await githubAPI.deleteMessage(token, messageId);
      dispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [token]);

  // 실시간 업데이트 시작
  const startRealtimeUpdates = useCallback(() => {
    if (intervalRef.current) return; // 이미 실행 중이면 리턴

    const checkForNewMessages = async () => {
      if (!token) return;

      try {
        const lastMessageId = localStorage.getItem(APP_CONFIG.storage.lastMessageId);
        const since = lastMessageId ? new Date(parseInt(lastMessageId)).toISOString() : undefined;
        
        const comments = await githubAPI.getMessages(token, { 
          per_page: 10,
          since 
        });

        if (comments.length > 0) {
          const newMessages = comments.map(transformComment);
          newMessages.forEach(message => {
            dispatch({ type: 'ADD_MESSAGE', payload: message });
          });
          
          // 마지막 메시지 ID 업데이트
          const lastMessage = newMessages[newMessages.length - 1];
          localStorage.setItem(APP_CONFIG.storage.lastMessageId, String(lastMessage.id));
        }
        
        dispatch({ type: 'SET_CONNECTED', payload: true });
        
      } catch (error) {
        console.error('Failed to check for new messages:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      }
    };

    intervalRef.current = setInterval(checkForNewMessages, APP_CONFIG.chat.refreshInterval);
  }, [token, transformComment]);

  // 실시간 업데이트 중지
  const stopRealtimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 인증 상태가 변경되면 메시지 새로고침
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshMessages();
    } else {
      // 로그아웃 시 상태 초기화
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_CHAT_INFO', payload: null });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      stopRealtimeUpdates();
    }
  }, [isAuthenticated, token, refreshMessages, stopRealtimeUpdates]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value: ChatContextType = {
    ...state,
    sendMessage,
    editMessage,
    deleteMessage,
    refreshMessages,
    startRealtimeUpdates,
    stopRealtimeUpdates,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}지막 메시지 ID 저장 (실시간 업데이트용)
      if (messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        localStorage.setItem(APP_CONFIG.storage.lastMessageId, String(lastMessageId));
      }
      
    } catch (error) {
      console.error('Failed to refresh messages:', error);
      const errorMessage = error instanceof Error ? error.message : '메시지를 불러오는 데 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } finally {
      dispatch({ type: 'LOADING_END' });
    }
  }, [token, transformComment, transformIssue]);

  // 새 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    if (!token) throw new Error('로그인이 필요합니다.');

    try {
      const comment = await githubAPI.sendMessage(token, content);
      const message = transformComment(comment);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // 마