import React, { createContext, useContext, useReducer, useCallback, useRef, type ReactNode } from 'react';
import { githubAPI } from '../services/api/github';
import type { ChatMessage, GitHubIssue } from '../types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  issue: GitHubIssue | null;
  currentIssueNumber: number | null;
  isRefreshing: boolean;
}

interface ChatAction {
  type: 'SET_MESSAGES' | 'ADD_MESSAGE' | 'UPDATE_MESSAGE' | 'DELETE_MESSAGE' | 'SET_LOADING' | 'SET_SENDING' | 'SET_ERROR' | 'SET_ISSUE' | 'SET_ISSUE_NUMBER' | 'SET_REFRESHING';
  payload: any;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  sending: false,
  error: null,
  issue: null,
  currentIssueNumber: null,
  isRefreshing: false,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, loading: false };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return { 
        ...state, 
        messages: state.messages.map(msg => 
          msg.id === action.payload.id ? { ...msg, content: action.payload.content, isEdited: true } : msg
        ) 
      };
    case 'DELETE_MESSAGE':
      return { 
        ...state, 
        messages: state.messages.filter(msg => msg.id !== action.payload) 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SENDING':
      return { ...state, sending: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, sending: false };
    case 'SET_ISSUE':
      return { ...state, issue: action.payload };
    case 'SET_ISSUE_NUMBER':
      return { ...state, currentIssueNumber: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string, issueNumber?: number) => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  refreshMessages: (issueNumber?: number) => Promise<void>;
  fetchIssueDetails: (issueNumber?: number) => Promise<void>;
  setCurrentIssueNumber: (issueNumber: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const refreshTimeoutRef = useRef<number | null>(null);

  const sendMessage = useCallback(async (content: string, issueNumber?: number) => {
    dispatch({ type: 'SET_SENDING', payload: true });
    try {
      const token = localStorage.getItem('github_token');
      if (!token) throw new Error('토큰이 없습니다.');

      const targetIssueNumber = issueNumber || state.currentIssueNumber;
      if (!targetIssueNumber) throw new Error('이슈 번호가 없습니다.');

      const comment = await githubAPI.sendMessage(token, content, targetIssueNumber);
      
      const message: ChatMessage = {
        id: comment.id,
        content: comment.body,
        author: {
          id: comment.user.id,
          username: comment.user.login,
          avatar: comment.user.avatar_url,
        },
        timestamp: new Date(comment.created_at).toLocaleString('ko-KR'),
        isEdited: false,
        isOwn: true,
        htmlUrl: comment.html_url,
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지 전송에 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_SENDING', payload: false });
    }
  }, [state.currentIssueNumber]);

  const refreshMessages = useCallback(async (issueNumber?: number) => {
    try {
      console.log('🔄 refreshMessages called with issueNumber:', issueNumber);
      
      // 기존 타임아웃이 있으면 취소
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        console.log('⏰ Cancelled previous refresh timeout');
      }
      
      // 이미 요청 중인지 확인
      if (state.isRefreshing) {
        console.log('⚠️ Already refreshing, skipping duplicate request');
        return;
      }
      
      const token = localStorage.getItem('github_token');
      console.log('🔑 Token exists:', !!token);
      if (!token) {
        console.log('❌ No token found, returning early');
        return;
      }

      const targetIssueNumber = issueNumber || state.currentIssueNumber;
      console.log('🎯 Target issue number:', targetIssueNumber);
      if (!targetIssueNumber) {
        console.log('❌ No issue number found, returning early');
        return;
      }

      // 디바운싱: 100ms 후에 실제 요청 실행
      refreshTimeoutRef.current = setTimeout(async () => {
        // 중복 요청 방지 플래그 설정
        console.log('🚀 Starting message refresh...');
        dispatch({ type: 'SET_REFRESHING', payload: true });
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log('📡 Fetching comments from GitHub API...');
        
        // 항상 fresh 데이터를 받아오기 위해 since 파라미터에 현재 시간 사용
        const comments = await githubAPI.getMessages(token, { since: String(Date.now()) }, targetIssueNumber);
        console.log('📨 Comments received:', comments.length);
        
        const messages: ChatMessage[] = comments.map(comment => ({
          id: comment.id,
          content: comment.body,
          author: {
            id: comment.user.id,
            username: comment.user.login,
            avatar: comment.user.avatar_url,
          },
          timestamp: new Date(comment.created_at).toLocaleString('ko-KR'),
          isEdited: comment.created_at !== comment.updated_at,
          isOwn: false,
          htmlUrl: comment.html_url,
        }));
        
        console.log('💬 Messages converted:', messages.length);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_REFRESHING', payload: false });
        console.log('✅ Message refresh completed successfully');
      }, 100);
      
    } catch (error) {
      console.error('❌ 메시지 새로고침 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지를 불러오는데 실패했습니다.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.currentIssueNumber, state.isRefreshing]);

  // 즉시 새로고침 함수 (디바운싱 없음)
  const refreshMessagesImmediately = useCallback(async (issueNumber?: number) => {
    try {
      console.log('🚀 Immediate refresh called with issueNumber:', issueNumber);
      
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.log('❌ No token found, returning early');
        return;
      }

      const targetIssueNumber = issueNumber || state.currentIssueNumber;
      if (!targetIssueNumber) {
        console.log('❌ No issue number found, returning early');
        return;
      }

      console.log('📡 Fetching comments from GitHub API immediately...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const comments = await githubAPI.getMessages(token, {}, targetIssueNumber);
      console.log('📨 Comments received:', comments.length);
      
      const messages: ChatMessage[] = comments.map(comment => ({
        id: comment.id,
        content: comment.body,
        author: {
          id: comment.user.id,
          username: comment.user.login,
          avatar: comment.user.avatar_url,
        },
        timestamp: new Date(comment.created_at).toLocaleString('ko-KR'),
        isEdited: comment.created_at !== comment.updated_at,
        isOwn: false,
        htmlUrl: comment.html_url,
      }));
      
      console.log('💬 Messages converted:', messages.length);
      dispatch({ type: 'SET_MESSAGES', payload: messages });
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('✅ Immediate refresh completed successfully');
      
    } catch (error) {
      console.error('❌ 즉시 새로고침 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지를 불러오는데 실패했습니다.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentIssueNumber]);

  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) throw new Error('토큰이 없습니다.');

      await githubAPI.editMessage(token, messageId, content);
      
      // 메시지 수정 후 즉시 새로고침
      const targetIssueNumber = state.currentIssueNumber;
      if (targetIssueNumber) {
        console.log('🔄 Auto-refreshing messages after edit...');
        await refreshMessagesImmediately(targetIssueNumber);
      } else {
        // 새로고침이 실패하면 로컬 상태에서만 업데이트
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: messageId, 
            content: content 
          } 
        });
      }
    } catch (error) {
      console.error('메시지 수정 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지 수정에 실패했습니다.' });
    }
  }, [state.currentIssueNumber, refreshMessagesImmediately]);

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) throw new Error('토큰이 없습니다.');

      await githubAPI.deleteMessage(token, messageId);
      
      // 메시지 삭제 후 즉시 새로고침
      const targetIssueNumber = state.currentIssueNumber;
      if (targetIssueNumber) {
        console.log('🔄 Auto-refreshing messages after deletion...');
        await refreshMessagesImmediately(targetIssueNumber);
      } else {
        // 새로고침이 실패하면 로컬 상태에서만 제거
        dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
      }
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지 삭제에 실패했습니다.' });
    }
  }, [state.currentIssueNumber, refreshMessagesImmediately]);

  const fetchIssueDetails = useCallback(async (issueNumber?: number) => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) return;
      
      const targetIssueNumber = issueNumber || state.currentIssueNumber;
      if (!targetIssueNumber) return;
      
      const issueData = await githubAPI.getChatRoom(token, targetIssueNumber);
      dispatch({ type: 'SET_ISSUE', payload: issueData });
    } catch (error) {
      console.error('이슈 정보 로딩 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '이슈 정보를 불러오는데 실패했습니다.' });
    }
  }, [state.currentIssueNumber]);

  const setCurrentIssueNumber = useCallback((issueNumber: number) => {
    dispatch({ type: 'SET_ISSUE_NUMBER', payload: issueNumber });
  }, []);

  return (
    <ChatContext.Provider value={{ 
      state, 
      dispatch, 
      sendMessage, 
      editMessage,
      deleteMessage,
      refreshMessages, 
      fetchIssueDetails, 
      setCurrentIssueNumber 
    }}>
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