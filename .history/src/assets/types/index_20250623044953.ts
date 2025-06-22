// GitHub API 관련 타입
export interface GitHubUser {
    id: number;
    login: string;
    avatar_url: string;
    name: string | null;
    email: string | null;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    user: GitHubUser;
    comments: number;
    html_url: string;
  }
  
  export interface GitHubComment {
    id: number;
    body: string;
    created_at: string;
    updated_at: string;
    user: GitHubUser;
    author_association: string;
    html_url: string;
  }
  
  // 채팅 앱 관련 타입
  export interface ChatMessage {
    id: number;
    content: string;
    timestamp: string;
    editedAt: string | null;
    author: {
      id: number;
      username: string;
      avatar: string;
      name?: string;
    };
    isEdited: boolean;
    isOwn: boolean;
    htmlUrl: string;
  }
  
  export interface ChatInfo {
    title: string;
    description: string | null;
    messageCount: number;
    participants: GitHubUser[];
    createdAt: string;
    updatedAt: string;
  }
  
  // 인증 관련 타입
  export interface AuthState {
    isAuthenticated: boolean;
    user: GitHubUser | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface AuthContextType extends AuthState {
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
  }
  
  // 채팅 상태 관리 타입
  export interface ChatState {
    messages: ChatMessage[];
    chatInfo: ChatInfo | null;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    lastUpdated: string | null;
  }
  
  export interface ChatContextType extends ChatState {
    sendMessage: (content: string) => Promise<void>;
    editMessage: (messageId: number, content: string) => Promise<void>;
    deleteMessage: (messageId: number) => Promise<void>;
    refreshMessages: () => Promise<void>;
    startRealtimeUpdates: () => void;
    stopRealtimeUpdates: () => void;
  }
  
  // API 응답 타입
  export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }
  
  export interface ApiError {
    message: string;
    status: number;
    documentation_url?: string;
  }
  
  // 폼 관련 타입
  export interface MessageForm {
    content: string;
  }
  
  export interface LoginForm {
    token: string;
  }
  
  // 테마 관련 타입
  export type ThemeMode = 'light' | 'dark' | 'system';
  
  export interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
  }
  
  // 로딩 상태 타입
  export interface LoadingState {
    loading: boolean;
    error: string | null;
  }
  
  // 컴포넌트 공통 Props 타입
  export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
  }
  
  // 로컬 스토리지 키 타입
  export type StorageKey = 
    | 'github_token'
    | 'user_data'
    | 'theme_mode'
    | 'last_message_id';
  
  // 에러 타입
  export interface AppError extends Error {
    code?: string;
    status?: number;
  }