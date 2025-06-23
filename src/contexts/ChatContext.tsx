import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { githubAppAPI } from '../services/api/github-app';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

interface ChatAction {
  type: 'SET_MESSAGES' | 'ADD_MESSAGE' | 'SET_LOADING' | 'SET_ERROR';
  payload: any;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const sendMessage = useCallback(async (content: string) => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      // GitHub API로 댓글 작성
      const comment = await githubAppAPI.createComment(token, content);
      
      // 메시지 형식으로 변환
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
        isOwn: true, // TODO: 현재 사용자와 비교
      htmlUrl: comment.html_url,
    };
      
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지 전송에 실패했습니다.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      console.log('refreshMessages called');
      const token = localStorage.getItem('github_token');
      console.log('Token exists:', !!token);
      if (!token) {
        console.log('No token found, returning early');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Fetching comments from GitHub API...');
      
      // GitHub API로 댓글 목록 가져오기
      const comments = await githubAppAPI.getIssueComments(token);
      console.log('Comments received:', comments);
      
      // 메시지 형식으로 변환
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
        isOwn: false, // TODO: 현재 사용자와 비교
        htmlUrl: comment.html_url,
      }));
      
      console.log('Messages converted:', messages);
      dispatch({ type: 'SET_MESSAGES', payload: messages });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('메시지 새로고침 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지를 불러오는데 실패했습니다.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage, refreshMessages }}>
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