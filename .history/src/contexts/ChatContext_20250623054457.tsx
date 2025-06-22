import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

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