import type { GitHubUser, GitHubIssue, GitHubComment, ApiError, ChatRoom, CreateChatRoomRequest, UpdateChatRoomRequest } from '../../types';
import { APP_CONFIG } from '../../config/app';

class GitHubAPI {
  private baseURL = 'https://api.github.com';
  private repoOwner = APP_CONFIG.github.repository.owner;
  private repoName = APP_CONFIG.github.repository.name;
  private issueNumber = APP_CONFIG.github.issueNumber;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          documentation_url: errorData.documentation_url,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError') {
        throw new Error('네트워크 연결을 확인해주세요.');
      }
      throw error;
    }
  }

  // 사용자 정보 조회
  async getUser(token: string): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user', {}, token);
  }

  // 채팅방 이슈 정보 조회
  async getChatIssue(token: string): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${this.issueNumber}`,
      {},
      token
    );
  }

  // 채팅방 목록 조회
  async getChatRooms(token: string): Promise<ChatRoom[]> {
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues?state=open&sort=updated&direction=desc`,
      {},
      token
    );
    
    // 각 채팅방의 마지막 메시지 정보를 가져오기
    const chatRoomsWithLastMessage = await Promise.all(
      issues.map(async (issue) => {
        try {
          const comments = await this.getMessages(token, { per_page: 1 }, issue.number);
          const lastMessage = comments.length > 0 ? comments[0].body : '';
          const lastMessageTime = comments.length > 0 ? comments[0].created_at : '';
          
          return {
            ...issue,
            lastMessage,
            lastMessageTime,
          } as ChatRoom;
        } catch (error) {
          return {
            ...issue,
            lastMessage: '',
            lastMessageTime: '',
          } as ChatRoom;
        }
      })
    );
    
    return chatRoomsWithLastMessage;
  }

  // 채팅방 생성
  async createChatRoom(token: string, data: CreateChatRoomRequest): Promise<ChatRoom> {
    return this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
  }

  // 채팅방 수정
  async updateChatRoom(
    token: string,
    issueNumber: number,
    data: UpdateChatRoomRequest
  ): Promise<ChatRoom> {
    return this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    );
  }

  // 채팅방 삭제 (이슈 닫기)
  async deleteChatRoom(token: string, issueNumber: number): Promise<ChatRoom> {
    return this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' }),
      },
      token
    );
  }

  // 특정 채팅방 정보 조회
  async getChatRoom(token: string, issueNumber: number): Promise<ChatRoom> {
    return this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {},
      token
    );
  }

  // 메시지 목록 조회 (이슈 댓글) - issueNumber 파라미터 추가
  async getMessages(
    token: string,
    params: {
      per_page?: number;
      page?: number;
      since?: string;
    } = {},
    issueNumber?: number
  ): Promise<GitHubComment[]> {
    const targetIssueNumber = issueNumber || this.issueNumber;
    const searchParams = new URLSearchParams();
    searchParams.set('per_page', String(params.per_page || 100));
    searchParams.set('page', String(params.page || 1));
    
    if (params.since) {
      searchParams.set('since', params.since);
    }

    return this.request<GitHubComment[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${targetIssueNumber}/comments?${searchParams.toString()}`,
      {},
      token
    );
  }

  // 새 메시지 전송 (댓글 생성) - issueNumber 파라미터 추가
  async sendMessage(token: string, content: string, issueNumber?: number): Promise<GitHubComment> {
    const targetIssueNumber = issueNumber || this.issueNumber;
    return this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${targetIssueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body: content }),
      },
      token
    );
  }

  // 메시지 수정 (댓글 수정)
  async editMessage(
    token: string,
    commentId: number,
    content: string
  ): Promise<GitHubComment> {
    return this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ body: content }),
      },
      token
    );
  }

  // 메시지 삭제 (댓글 삭제)
  async deleteMessage(token: string, commentId: number): Promise<void> {
    await this.request<void>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      {
        method: 'DELETE',
      },
      token
    );
  }

  // 저장소 접근 권한 확인
  async checkRepositoryAccess(token: string): Promise<boolean> {
    try {
      await this.request<any>(
        `/repos/${this.repoOwner}/${this.repoName}`,
        {},
        token
      );
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404 || apiError.status === 403) {
        return false;
      }
      throw error;
    }
  }

  // 이슈 존재 여부 확인
  async checkIssueExists(token: string): Promise<boolean> {
    try {
      await this.getChatIssue(token);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

export const githubAPI = new GitHubAPI();