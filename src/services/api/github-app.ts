import { GITHUB_APP_CONFIG } from '../../config/github-app';
import type { GitHubAppInstallation, GitHubAppToken } from '../../config/github-app';
import type { GitHubUser, GitHubIssue, GitHubComment, ApiError } from '../../types';

class GitHubAppAPI {
  private baseURL = GITHUB_APP_CONFIG.api.baseUrl;
  private repoOwner = import.meta.env.VITE_GITHUB_REPO_OWNER || 'demo-user';
  private repoName = import.meta.env.VITE_GITHUB_REPO_NAME || 'github-issues-chat';

  constructor() {
    console.log('GitHubAppAPI initialized with:', {
      baseURL: this.baseURL,
      repoOwner: this.repoOwner,
      repoName: this.repoName
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    // 캐시 방지를 위한 타임스탬프 추가
    const timestamp = Date.now();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseURL}${endpoint}${separator}_t=${timestamp}`;
    console.log('Making API request to:', url);
    
    const headers: Record<string, string> = {
      'Accept': GITHUB_APP_CONFIG.api.acceptHeader,
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

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          documentation_url: errorData.documentation_url,
        };
        throw error;
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof Error && error.name === 'TypeError') {
        throw new Error('네트워크 연결을 확인해주세요.');
      }
      throw error;
    }
  }

  // GitHub App 설치 정보 조회
  async getInstallations(token: string): Promise<GitHubAppInstallation[]> {
    return this.request<GitHubAppInstallation[]>('/user/installations', {}, token);
  }

  // 특정 저장소에 대한 설치 정보 조회
  async getRepositoryInstallation(token: string): Promise<GitHubAppInstallation> {
    return this.request<GitHubAppInstallation>(
      `/repos/${this.repoOwner}/${this.repoName}/installation`,
      {},
      token
    );
  }

  // 설치 토큰 생성
  async createInstallationToken(installationId: number, token: string): Promise<GitHubAppToken> {
    return this.request<GitHubAppToken>(
      `/app/installations/${installationId}/access_tokens`,
      { method: 'POST' },
      token
    );
  }

  // 사용자 정보 조회
  async getUser(token: string): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user', {}, token);
  }

  // 채팅방 이슈 정보 조회 (이슈 번호 필수)
  async getChatIssue(token: string, issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {},
      token
    );
  }

  // 이슈 댓글 목록 조회 (이슈 번호 필수)
  async getIssueComments(token: string, issueNumber: number): Promise<GitHubComment[]> {
    return this.request<GitHubComment[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments`,
      {},
      token
    );
  }

  // 새 댓글 작성 (이슈 번호 필수)
  async createComment(token: string, body: string, issueNumber: number): Promise<GitHubComment> {
    return this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
      token
    );
  }

  // 댓글 수정
  async updateComment(token: string, commentId: number, body: string): Promise<GitHubComment> {
    return this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      },
      token
    );
  }

  // 댓글 삭제
  async deleteComment(token: string, commentId: number): Promise<void> {
    await this.request<void>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      { method: 'DELETE' },
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

  // 설치 URL 생성
  getInstallUrl(state?: string): string {
    return GITHUB_APP_CONFIG.getInstallUrl(state);
  }
}

export const githubAppAPI = new GitHubAppAPI(); 