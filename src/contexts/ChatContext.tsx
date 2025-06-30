import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { githubAPI } from '../services/api/github';
import type { ChatMessage, GitHubIssue } from '../types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  issue: GitHubIssue | null;
  currentIssueNumber: number | null;
}

interface ChatAction {
  type: 'SET_MESSAGES' | 'ADD_MESSAGE' | 'SET_LOADING' | 'SET_SENDING' | 'SET_ERROR' | 'SET_ISSUE' | 'SET_ISSUE_NUMBER';
  payload: any;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  sending: false,
  error: null,
  issue: null,
  currentIssueNumber: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, loading: false };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
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
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string, issueNumber?: number) => Promise<void>;
  refreshMessages: (issueNumber?: number) => Promise<void>;
  fetchIssueDetails: (issueNumber?: number) => Promise<void>;
  setCurrentIssueNumber: (issueNumber: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

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
      console.log('refreshMessages called');
      const token = localStorage.getItem('github_token');
      console.log('Token exists:', !!token);
      if (!token) {
        console.log('No token found, returning early');
        return;
      }

      const targetIssueNumber = issueNumber || state.currentIssueNumber;
      if (!targetIssueNumber) {
        console.log('No issue number found, returning early');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Fetching comments from GitHub API...');
      
      const comments = await githubAPI.getMessages(token, {}, targetIssueNumber);
      console.log('Comments received:', comments);
      
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
      
      console.log('Messages converted:', messages);
      dispatch({ type: 'SET_MESSAGES', payload: messages });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('메시지 새로고침 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '메시지를 불러오는데 실패했습니다.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentIssueNumber]);

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