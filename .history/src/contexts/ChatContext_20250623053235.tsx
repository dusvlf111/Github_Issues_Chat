import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { ChatContextType, ChatState, ChatMessage, ChatInfo, GitHubComment, GitHubIssue } from '../types';
import { githubAPI } from '../services/api/github';
import { useAuth } from './AuthContext';
import { APP_CONFIG } from '../config/app';

interface ChatState {
  currentRoom: string | null;
  messages: any[];
  isLoading: boolean;
}

interface ChatAction {
  type: 'SET_CURRENT_ROOM' | 'SET_MESSAGES' | 'SET_LOADING' | 'ADD_MESSAGE';
  payload: any;
}

const initialState: ChatState = {
  currentRoom: null,
  messages: [],
  isLoading: false,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // 이슈 정보와 댓글 병렬 조회
      const [issue, comments] = await Promise.all([
        githubAPI.getChatIssue(token),
        githubAPI.getMessages(token, { per_page: 100 }),
      ]);

      const chatInfo = transformIssue(issue);
      const messages = comments.map(transformComment);

      dispatch({ type: 'SET_MESSAGES', payload: messages });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: issue.title });
      
      // 마지막 메시지 ID 업데이트
      if (messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        localStorage.setItem(APP_CONFIG.storage.lastMessageId, String(lastMessageId));
      }
      
    } catch (error) {
      console.error('Failed to refresh messages:', error);
      const errorMessage = error instanceof Error ? error.message : '메시지를 불러오는 데 실패했습니다.';
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, [token, transformComment, transformIssue]);

  // 메시지 수정
  const editMessage = useCallback(async (messageId: number, content: string) => {
    if (!token) throw new Error('로그인이 필요합니다.');

    try {
      const comment = await githubAPI.editMessage(token, messageId, content);
      const message = transformComment(comment);
      dispatch({ type: 'SET_MESSAGES', payload: [...state.messages.filter(m => m.id !== messageId), message] });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 수정에 실패했습니다.';
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [token, state.messages, transformComment]);

  // 메시지 삭제
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!token) throw new Error('로그인이 필요합니다.');

    try {
      await githubAPI.deleteMessage(token, messageId);
      dispatch({ type: 'SET_MESSAGES', payload: state.messages.filter(m => m.id !== messageId) });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.';
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [token, state.messages]);

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
          dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, ...newMessages] });
          
          // 마지막 메시지 ID 업데이트
          const lastMessage = newMessages[newMessages.length - 1];
          localStorage.setItem(APP_CONFIG.storage.lastMessageId, String(lastMessage.id));
        }
        
        dispatch({ type: 'SET_CURRENT_ROOM', payload: comments[0].issue.title });
        
      } catch (error) {
        console.error('Failed to check for new messages:', error);
        dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
      }
    };

    intervalRef.current = setInterval(checkForNewMessages, APP_CONFIG.chat.refreshInterval);
  }, [token, state.messages, transformComment]);

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
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
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
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};