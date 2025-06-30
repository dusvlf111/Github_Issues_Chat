import { GITHUB_APP_CONFIG } from '../../config/github-app';
import type { GitHubAppInstallation, GitHubAppToken } from '../../config/github-app';
import type { GitHubUser, GitHubIssue, GitHubComment, ApiError } from '../../types';

class GitHubAppAPI {
  private baseURL = GITHUB_APP_CONFIG.api.baseUrl;
  private repoOwner = import.meta.env.VITE_GITHUB_REPO_OWNER || 'demo-user';
  private repoName = import.meta.env.VITE_GITHUB_REPO_NAME || 'github-issues-chat';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    console.log('GitHubAppAPI initialized with:', {
      baseURL: this.baseURL,
      repoOwner: this.repoOwner,
      repoName: this.repoName
    });
  }

  // 캐시에서 데이터 가져오기
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  // 캐시에 데이터 저장하기
  private setCache<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // 캐시 키 생성
  private getCacheKey(method: string, params: any = {}): string {
    return `${method}_${this.repoOwner}_${this.repoName}_${JSON.stringify(params)}`;
  }

  // 성능 측정을 위한 래퍼 메서드
  private async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`${name} 실행 시간: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`${name} 실행 시간: ${(end - start).toFixed(2)}ms (실패)`);
      throw error;
    }
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

  // 사용자 정보 조회 (GraphQL 최적화)
  async getUser(token: string): Promise<GitHubUser> {
    return this.measurePerformance('getUser', async () => {
      const cacheKey = this.getCacheKey('getUser', { token: token.substring(0, 8) });
      
      // 캐시에서 데이터 확인
      const cached = this.getFromCache<GitHubUser>(cacheKey);
      if (cached) {
        console.log('✅ 캐시에서 사용자 정보를 가져왔습니다.');
        return cached;
      }

      console.log('🚀 GraphQL을 사용하여 사용자 정보를 가져오는 중...');
      
      const query = `
        query {
          viewer {
            id
            login
            name
            email
            avatarUrl
            url
          }
        }
      `;

      try {
        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const viewer = data.data.viewer;
        const user: GitHubUser = {
          id: viewer.id,
          login: viewer.login,
          name: viewer.name,
          email: viewer.email,
          avatar_url: viewer.avatarUrl,
          html_url: viewer.url,
        };

        // 결과를 캐시에 저장 (10분간 유효)
        this.setCache(cacheKey, user, 10 * 60 * 1000);
        console.log('✅ GraphQL을 사용하여 사용자 정보를 가져왔습니다.');
        
        return user;
      } catch (error) {
        console.warn('❌ GraphQL request failed, falling back to REST API:', error);
        // GraphQL이 실패하면 기존 REST API 방식으로 fallback
        return this.getUserFallback(token);
      }
    });
  }

  // 사용자 정보 조회 (REST API fallback)
  private async getUserFallback(token: string): Promise<GitHubUser> {
    console.log('🔄 REST API fallback을 사용하여 사용자 정보를 가져오는 중...');
    return this.request<GitHubUser>('/user', {}, token);
  }

  // 채팅방 이슈 정보 조회 (GraphQL 최적화)
  async getChatIssue(token: string, issueNumber: number): Promise<GitHubIssue> {
    return this.measurePerformance('getChatIssue', async () => {
      const cacheKey = this.getCacheKey('getChatIssue', { issueNumber });
      
      // 캐시에서 데이터 확인
      const cached = this.getFromCache<GitHubIssue>(cacheKey);
      if (cached) {
        console.log(`✅ 캐시에서 이슈 #${issueNumber} 정보를 가져왔습니다.`);
        return cached;
      }

      console.log(`🚀 GraphQL을 사용하여 이슈 #${issueNumber} 정보를 가져오는 중...`);
      
      const query = `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            issue(number: $number) {
              id
              number
              title
              body
              state
              comments {
                totalCount
              }
              createdAt
              updatedAt
              url
              labels(first: 10) {
                nodes {
                  id
                  name
                  color
                  description
                }
              }
              author {
                login
                avatarUrl
                url
              }
            }
          }
        }
      `;

      try {
        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              owner: this.repoOwner,
              name: this.repoName,
              number: issueNumber,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const issue = data.data.repository.issue;
        if (!issue) {
          throw new Error(`Issue #${issueNumber} not found`);
        }

        const githubIssue: GitHubIssue = {
          id: parseInt(issue.id),
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          comments: issue.comments.totalCount,
          created_at: issue.createdAt,
          updated_at: issue.updatedAt,
          html_url: issue.url,
          labels: issue.labels.nodes.map((label: any) => ({
            id: parseInt(label.id),
            name: label.name,
            color: label.color,
            description: label.description,
          })),
          user: {
            id: 0, // GraphQL에서 제공하지 않으므로 기본값
            login: issue.author?.login || 'unknown',
            name: undefined, // GraphQL에서 제공하지 않음
            email: undefined, // GraphQL에서 제공하지 않음
            avatar_url: issue.author?.avatarUrl || '',
            html_url: issue.author?.url || '',
          },
        };

        // 결과를 캐시에 저장 (5분간 유효)
        this.setCache(cacheKey, githubIssue, 5 * 60 * 1000);
        console.log(`✅ GraphQL을 사용하여 이슈 #${issueNumber} 정보를 가져왔습니다.`);
        
        return githubIssue;
      } catch (error) {
        console.warn(`❌ GraphQL request failed for issue #${issueNumber}, falling back to REST API:`, error);
        // GraphQL이 실패하면 기존 REST API 방식으로 fallback
        return this.getChatIssueFallback(token, issueNumber);
      }
    });
  }

  // 채팅방 이슈 정보 조회 (REST API fallback)
  private async getChatIssueFallback(token: string, issueNumber: number): Promise<GitHubIssue> {
    console.log(`🔄 REST API fallback을 사용하여 이슈 #${issueNumber} 정보를 가져오는 중...`);
    return this.request<GitHubIssue>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {},
      token
    );
  }

  // 이슈 댓글 목록 조회 (캐싱 최적화)
  async getIssueComments(token: string, issueNumber: number): Promise<GitHubComment[]> {
    const cacheKey = this.getCacheKey('getIssueComments', { issueNumber });
    const cachedData = this.getFromCache<GitHubComment[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const result = await this.request<GitHubComment[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments`,
      {},
      token
    );
    this.setCache(cacheKey, result, 60 * 1000); // 1분간 캐시
    return result;
  }

  // 새 댓글 작성 (캐시 무효화)
  async createComment(token: string, body: string, issueNumber: number): Promise<GitHubComment> {
    const result = await this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
      token
    );
    
    // 관련 캐시 무효화
    this.invalidateCommentCache(issueNumber);
    return result;
  }

  // 댓글 수정 (캐시 무효화)
  async updateComment(token: string, commentId: number, body: string): Promise<GitHubComment> {
    const result = await this.request<GitHubComment>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      },
      token
    );
    
    // 모든 댓글 캐시 무효화
    this.invalidateAllCommentCache();
    return result;
  }

  // 댓글 삭제 (캐시 무효화)
  async deleteComment(token: string, commentId: number): Promise<void> {
    await this.request<void>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
      { method: 'DELETE' },
      token
    );
    
    // 모든 댓글 캐시 무효화
    this.invalidateAllCommentCache();
  }

  // 특정 이슈의 댓글 캐시 무효화
  private invalidateCommentCache(issueNumber: number): void {
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes('getIssueComments') && key.includes(`"issueNumber":${issueNumber}`)
    );
    cacheKeys.forEach(key => this.cache.delete(key));
  }

  // 모든 댓글 캐시 무효화
  private invalidateAllCommentCache(): void {
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes('getIssueComments')
    );
    cacheKeys.forEach(key => this.cache.delete(key));
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