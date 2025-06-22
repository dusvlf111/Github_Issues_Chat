import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
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

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

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