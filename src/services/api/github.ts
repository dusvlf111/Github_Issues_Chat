import type { GitHubUser, GitHubIssue, GitHubComment, ApiError, ChatRoom, CreateChatRoomRequest, UpdateChatRoomRequest, GitHubLabel } from '../../types';
import { APP_CONFIG } from '../../config/app';

class GitHubAPI {
  private baseURL = 'https://api.github.com';
  private repoOwner = APP_CONFIG.github.repository.owner;
  private repoName = APP_CONFIG.github.repository.name;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>(); // 진행 중인 요청 추적
  private requestCounters = new Map<string, number>(); // 요청 카운터 (디버깅용)

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

      // DELETE 요청의 경우 응답 본문이 없으므로 JSON 파싱을 시도하지 않음
      if (options.method === 'DELETE') {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError') {
        throw new Error('네트워크 연결을 확인해주세요.');
      }
      throw error;
    }
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
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          comments: issue.comments.totalCount,
          created_at: issue.createdAt,
          updated_at: issue.updatedAt,
          html_url: issue.url,
          labels: issue.labels.nodes.map((label: any) => ({
            id: label.id,
            name: label.name,
            color: label.color,
            description: label.description,
          })),
          user: {
            id: issue.author?.id || 0,
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

  // GraphQL을 사용한 채팅방 목록 조회 (최적화된 버전)
  async getChatRoomsOptimized(token: string, useCache: boolean = true): Promise<ChatRoom[]> {
    return this.measurePerformance('getChatRoomsOptimized', async () => {
      const cacheKey = this.getCacheKey('getChatRoomsOptimized', { token: token.substring(0, 8) });
      
      // 캐시에서 데이터 확인
      if (useCache) {
        const cached = this.getFromCache<ChatRoom[]>(cacheKey);
        if (cached) {
          console.log('✅ 캐시에서 채팅방 목록을 가져왔습니다.');
          return cached;
        }
      }

      console.log('🚀 GraphQL을 사용하여 채팅방 목록을 가져오는 중...');
      
      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            issues(first: 100, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
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
                    name
                    color
                  }
                }
                author {
                  login
                  avatarUrl
                }
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

        const issues = data.data.repository.issues.nodes;
        console.log(`📊 총 ${issues.length}개의 이슈를 가져왔습니다.`);
        
        // "chat" 라벨이 붙은 이슈만 필터링하고 ChatRoom 형태로 변환
        const chatRooms = issues
          .filter((issue: any) => 
            issue.labels.nodes.some((label: any) => label.name === 'chat')
          )
          .map((issue: any) => {
            return {
              id: issue.id,
              number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              comments: issue.comments.totalCount,
              created_at: issue.createdAt,
              updated_at: issue.updatedAt,
              html_url: issue.url,
              labels: issue.labels.nodes.map((label: any) => ({
                name: label.name,
                color: label.color,
              })),
              user: {
                id: 0, // GraphQL에서 제공하지 않으므로 기본값
                login: issue.author?.login || 'unknown',
                name: undefined, // GraphQL에서 제공하지 않음
                email: undefined, // GraphQL에서 제공하지 않음
                avatar_url: issue.author?.avatarUrl || '',
                html_url: '', // GraphQL에서 제공하지 않음
              },
              lastMessage: '', // 마지막 메시지 정보 제거
              lastMessageTime: '', // 마지막 메시지 시간 제거
            } as ChatRoom;
          });

        console.log(`💬 ${chatRooms.length}개의 채팅방을 찾았습니다.`);
        
        // 결과를 캐시에 저장 (5분간 유효)
        this.setCache(cacheKey, chatRooms, 5 * 60 * 1000);
        console.log('✅ GraphQL을 사용하여 채팅방 목록을 가져왔습니다.');
        
        return chatRooms;
      } catch (error) {
        console.warn('❌ GraphQL request failed, falling back to GraphQL Search:', error);
        // GraphQL이 실패하면 GraphQL Search로 fallback
        try {
          return await this.getChatRoomsWithGraphQLSearch(token);
        } catch (graphqlSearchError) {
          console.warn('❌ GraphQL Search failed, falling back to REST Search API:', graphqlSearchError);
          // GraphQL Search도 실패하면 REST Search API로 fallback
          try {
            return await this.getChatRoomsWithSearchAPI(token);
          } catch (searchError) {
            console.warn('❌ Search API failed, falling back to REST API:', searchError);
            // Search API도 실패하면 최종적으로 기존 REST API 방식으로 fallback
            return this.getChatRoomsOptimizedFallback(token);
          }
        }
      }
    });
  }

  // 최적화된 REST API fallback 메서드
  async getChatRoomsOptimizedFallback(token: string): Promise<ChatRoom[]> {
    console.log('🔄 REST API fallback을 사용합니다.');
    
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues?state=open&sort=updated&direction=desc&per_page=100`,
      {},
      token
    );
    
    // "chat" 라벨이 붙은 이슈만 필터링
    const chatIssues = issues.filter(issue => 
      issue.labels && issue.labels.some(label => label.name === 'chat')
    );
    
    console.log(`📊 REST API로 ${chatIssues.length}개의 채팅방을 찾았습니다.`);
    
    // ChatRoom 형태로 변환 (마지막 메시지 정보 없이)
    const chatRooms = chatIssues.map((issue) => {
      return {
        ...issue,
        lastMessage: '', // 마지막 메시지 정보 제거
        lastMessageTime: '', // 마지막 메시지 시간 제거
      } as ChatRoom;
    });

    console.log('✅ REST API fallback을 사용하여 채팅방 목록을 가져왔습니다.');
    return chatRooms;
  }

  // 채팅방 목록 조회 (기존 방식 - fallback용)
  async getChatRooms(token: string): Promise<ChatRoom[]> {
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues?state=open&sort=updated&direction=desc&per_page=100`,
      {},
      token
    );
    
    // "chat" 라벨이 붙은 이슈만 필터링
    const chatIssues = issues.filter(issue => 
      issue.labels && issue.labels.some(label => label.name === 'chat')
    );
    
    // ChatRoom 형태로 변환 (마지막 메시지 정보 없이)
    const chatRooms = chatIssues.map((issue) => {
      return {
        ...issue,
        lastMessage: '', // 마지막 메시지 정보 제거
        lastMessageTime: '', // 마지막 메시지 시간 제거
      } as ChatRoom;
    });
    
    return chatRooms;
  }

  // 채팅방 생성
  async createChatRoom(token: string, data: CreateChatRoomRequest): Promise<ChatRoom> {
    // "chat" 라벨을 자동으로 추가
    const requestData = {
      ...data,
      labels: ['chat', ...(data.labels || [])]
    };
    
    const result = await this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      token
    );

    // 캐시 무효화
    this.invalidateChatRoomsCache();
    
    return result;
  }

  // 채팅방 수정
  async updateChatRoom(
    token: string,
    issueNumber: number,
    data: UpdateChatRoomRequest
  ): Promise<ChatRoom> {
    // "chat" 라벨이 유지되도록 보장
    const requestData = {
      ...data,
      labels: data.labels ? ['chat', ...data.labels.filter(label => label !== 'chat')] : undefined
    };
    
    const result = await this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(requestData),
      },
      token
    );

    // 캐시 무효화
    this.invalidateChatRoomsCache();
    
    return result;
  }

  // 채팅방 삭제 (이슈 닫기)
  async deleteChatRoom(token: string, issueNumber: number): Promise<ChatRoom> {
    const result = await this.request<ChatRoom>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' }),
      },
      token
    );

    // 캐시 무효화
    this.invalidateChatRoomsCache();
    
    return result;
  }

  // 특정 채팅방 정보 조회 (GraphQL 최적화)
  async getChatRoom(token: string, issueNumber: number): Promise<ChatRoom> {
    const requestKey = `getChatRoom_${issueNumber}`;
    
    // 이미 진행 중인 동일한 요청이 있는지 확인
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 중복 요청 방지: ${requestKey} 요청이 이미 진행 중입니다.`);
      return this.pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = this.measurePerformance('getChatRoom', async () => {
      const cacheKey = this.getCacheKey('getChatRoom', { issueNumber });
      
      // 캐시에서 데이터 확인
      const cached = this.getFromCache<ChatRoom>(cacheKey);
      if (cached) {
        console.log(`✅ 캐시에서 채팅방 #${issueNumber} 정보를 가져왔습니다.`);
        return cached;
      }

      console.log(`🚀 GraphQL을 사용하여 채팅방 #${issueNumber} 정보를 가져오는 중...`);
      
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

        const chatRoom: ChatRoom = {
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
          lastMessage: '', // 마지막 메시지 정보 제거
          lastMessageTime: '', // 마지막 메시지 시간 제거
        };

        // 결과를 캐시에 저장 (5분간 유효)
        this.setCache(cacheKey, chatRoom, 5 * 60 * 1000);
        console.log(`✅ GraphQL을 사용하여 채팅방 #${issueNumber} 정보를 가져왔습니다.`);
        
        return chatRoom;
      } catch (error) {
        console.warn(`❌ GraphQL request failed for chat room #${issueNumber}, falling back to REST API:`, error);
        // GraphQL이 실패하면 기존 REST API 방식으로 fallback
        return this.getChatRoomFallback(token, issueNumber);
      }
    });
    
    // 진행 중인 요청을 Map에 저장
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // 요청 완료 후 Map에서 제거
      this.pendingRequests.delete(requestKey);
    }
  }

  // 특정 채팅방 정보 조회 (REST API fallback)
  private async getChatRoomFallback(token: string, issueNumber: number): Promise<ChatRoom> {
    console.log(`🔄 REST API fallback을 사용하여 채팅방 #${issueNumber} 정보를 가져오는 중...`);
    const issue = await this.request<GitHubIssue>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
      {},
      token
    );
    
    return {
      ...issue,
      lastMessage: '',
      lastMessageTime: '',
    } as ChatRoom;
  }

  // 메시지 목록 조회 (GraphQL 최적화)
  async getMessages(
    token: string,
    params: {
      per_page?: number;
      page?: number;
      since?: string;
    } = {},
    issueNumber: number
  ): Promise<GitHubComment[]> {
    const requestKey = `getMessages_${issueNumber}_${JSON.stringify(params)}`;
    
    // 요청 카운터 증가
    const currentCount = (this.requestCounters.get(requestKey) || 0) + 1;
    this.requestCounters.set(requestKey, currentCount);
    
    console.log(`🔍 getMessages 요청 #${currentCount}: ${requestKey}`);
    
    // 이미 진행 중인 동일한 요청이 있는지 확인
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 중복 요청 방지: ${requestKey} 요청이 이미 진행 중입니다. (요청 #${currentCount})`);
      return this.pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = this.measurePerformance('getMessages', async () => {
      console.log(`🚀 실제 GraphQL 요청 시작: ${requestKey} (요청 #${currentCount})`);
      
      const cacheKey = this.getCacheKey('getMessages', { issueNumber, ...params });
      
      // 캐시에서 데이터 확인 (since 파라미터가 없을 때만 캐시 사용)
      if (!params.since) {
        const cached = this.getFromCache<GitHubComment[]>(cacheKey);
        if (cached) {
          console.log(`✅ 캐시에서 이슈 #${issueNumber} 댓글을 가져왔습니다. (요청 #${currentCount})`);
          return cached;
        }
      }

      console.log(`🚀 GraphQL을 사용하여 이슈 #${issueNumber} 댓글을 가져오는 중... (요청 #${currentCount})`);
      
      const first = params.per_page || 100;
      const query = `
        query GetIssueComments($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            issue(number: $number) {
              comments(first: 100) {
                nodes {
                  databaseId
                  body
                  createdAt
                  updatedAt
                  url
                  author {
                    ... on User {
                      login
                      avatarUrl
                      url
                      id
                    }
                  }
                }
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

        console.log(`📊 GraphQL 응답 수신: ${requestKey} (요청 #${currentCount})`);
        
        const issue = data.data.repository.issue;
        if (!issue) {
          console.warn(`Issue #${issueNumber} not found in GraphQL response`);
          throw new Error(`Issue #${issueNumber} not found`);
        }

        const comments = issue.comments.nodes;
        console.log(`Found ${comments.length} comments for issue #${issueNumber} (요청 #${currentCount})`);
        
        // GitHubComment 형태로 변환
        const githubComments: GitHubComment[] = comments.map((comment: any, index: number) => {
          // GraphQL id는 매우 긴 문자열 형태의 숫자일 수 있으므로 안전하게 변환
          let numericId: number;
          if (comment.databaseId && !isNaN(Number(comment.databaseId))) {
            numericId = Number(comment.databaseId);
          } else {
            // 유효하지 않은 id인 경우 고유한 숫자 생성 (timestamp + index)
            numericId = Date.now() + index;
          }
          
          return {
            id: numericId,
            body: comment.body,
            created_at: comment.createdAt,
            updated_at: comment.updatedAt,
            html_url: comment.url,
            issue_url: `https://github.com/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`,
            user: {
              id: comment.author?.id || 0,
              login: comment.author?.login || 'unknown',
              name: undefined, // GraphQL에서 제공하지 않음
              email: undefined, // GraphQL에서 제공하지 않음
              avatar_url: comment.author?.avatarUrl || '',
              html_url: comment.author?.url || '',
            },
          };
        });

        // 결과를 캐시에 저장 (1분간 유효, since 파라미터가 없을 때만)
        if (!params.since) {
          this.setCache(cacheKey, githubComments, 60 * 1000);
        }
        
        console.log(`✅ GraphQL을 사용하여 이슈 #${issueNumber} 댓글을 가져왔습니다. (요청 #${currentCount})`);
        return githubComments;
      } catch (error) {
        console.warn(`❌ GraphQL request failed for issue #${issueNumber} comments:`, error);
        console.warn('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          issueNumber,
          params,
          requestCount: currentCount
        });
        // GraphQL이 실패하면 기존 REST API 방식으로 fallback
        return this.getMessagesFallback(token, params, issueNumber);
      }
    });
    
    // 진행 중인 요청을 Map에 저장
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // 요청 완료 후 Map에서 제거
      this.pendingRequests.delete(requestKey);
      console.log(`🏁 요청 완료: ${requestKey} (요청 #${currentCount})`);
    }
  }

  // 메시지 목록 조회 (REST API fallback)
  private async getMessagesFallback(
    token: string,
    params: {
      per_page?: number;
      page?: number;
      since?: string;
    } = {},
    issueNumber: number
  ): Promise<GitHubComment[]> {
    console.log(`🔄 REST API fallback을 사용하여 이슈 #${issueNumber} 댓글을 가져오는 중...`);
    
    const searchParams = new URLSearchParams();
    searchParams.set('per_page', String(params.per_page || 100));
    searchParams.set('page', String(params.page || 1));
    
    if (params.since) {
      searchParams.set('since', params.since);
    }

    return this.request<GitHubComment[]>(
      `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments?${searchParams.toString()}`,
      {},
      token
    );
  }

  // 새 메시지 전송 (댓글 생성) - issueNumber 파라미터 필수
  async sendMessage(token: string, content: string, issueNumber: number): Promise<GitHubComment> {
    return this.measurePerformance('sendMessage', async () => {
      console.log(`🚀 메시지 전송 중... (이슈 #${issueNumber})`);
      
      const result = await this.request<GitHubComment>(
        `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ body: content }),
        },
        token
      );
      
      // 관련 캐시 무효화
      this.invalidateMessageCache(issueNumber);
      console.log(`✅ 메시지 전송 완료 (이슈 #${issueNumber})`);
      
      return result;
    });
  }

  // 메시지 수정 (댓글 수정)
  async editMessage(
    token: string,
    commentId: number,
    content: string
  ): Promise<GitHubComment> {
    return this.measurePerformance('editMessage', async () => {
      console.log(`🚀 메시지 수정 중... (댓글 #${commentId})`);
      
      const result = await this.request<GitHubComment>(
        `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ body: content }),
        },
        token
      );
      
      // 관련 캐시 무효화 (이슈 번호를 알 수 없으므로 모든 메시지 캐시 무효화)
      this.invalidateAllMessageCache();
      console.log(`✅ 메시지 수정 완료 (댓글 #${commentId})`);
      
      return result;
    });
  }

  // 메시지 삭제 (댓글 삭제)
  async deleteMessage(token: string, commentId: number): Promise<void> {
    return this.measurePerformance('deleteMessage', async () => {
      console.log(`🚀 메시지 삭제 중... (댓글 #${commentId})`);
      
      await this.request<void>(
        `/repos/${this.repoOwner}/${this.repoName}/issues/comments/${commentId}`,
        {
          method: 'DELETE',
        },
        token
      );
      
      // 관련 캐시 무효화 (이슈 번호를 알 수 없으므로 모든 메시지 캐시 무효화)
      this.invalidateAllMessageCache();
      console.log(`✅ 메시지 삭제 완료 (댓글 #${commentId})`);
    });
  }

  // 특정 이슈의 메시지 캐시 무효화
  private invalidateMessageCache(issueNumber: number): void {
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes('getMessages') && key.includes(`"issueNumber":${issueNumber}`)
    );
    cacheKeys.forEach(key => this.cache.delete(key));
    console.log(`메시지 캐시가 무효화되었습니다. (이슈 #${issueNumber})`);
  }

  // 모든 메시지 캐시 무효화
  private invalidateAllMessageCache(): void {
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes('getMessages')
    );
    cacheKeys.forEach(key => this.cache.delete(key));
    console.log('모든 메시지 캐시가 무효화되었습니다.');
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

  // 이슈 존재 여부 확인 (특정 이슈 번호)
  async checkIssueExists(token: string, issueNumber: number): Promise<boolean> {
    try {
      await this.getChatIssue(token, issueNumber);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // 라벨 목록 조회
  async getLabels(token: string): Promise<GitHubLabel[]> {
    return this.request<GitHubLabel[]>(
      `/repos/${this.repoOwner}/${this.repoName}/labels`,
      {},
      token
    );
  }

  // "chat" 라벨 생성 (없는 경우)
  async ensureChatLabel(token: string): Promise<void> {
    try {
      // 기존 라벨 확인
      const labels = await this.getLabels(token);
      const chatLabel = labels.find(label => label.name === 'chat');
      
      if (!chatLabel) {
        // "chat" 라벨이 없으면 생성
        await this.request<GitHubLabel>(
          `/repos/${this.repoOwner}/${this.repoName}/labels`,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'chat',
              color: '0e8a16', // GitHub 녹색
              description: '채팅방으로 사용되는 이슈'
            }),
          },
          token
        );
      }
    } catch (error) {
      console.warn('"chat" 라벨 생성 실패:', error);
      // 라벨 생성 실패는 치명적이지 않으므로 경고만 출력
    }
  }

  // 이슈가 채팅방인지 확인
  async isChatRoom(token: string, issueNumber: number): Promise<boolean> {
    try {
      const issue = await this.getChatRoom(token, issueNumber);
      return issue.labels && issue.labels.some(label => label.name === 'chat');
    } catch (error) {
      return false;
    }
  }

  // 캐시 무효화
  invalidateChatRoomsCache(): void {
    const cacheKey = this.getCacheKey('getChatRoomsOptimized');
    this.cache.delete(cacheKey);
    console.log('채팅방 목록 캐시가 무효화되었습니다.');
  }

  // 캐시 통계 조회
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // 캐시 전체 삭제
  clearCache(): void {
    this.cache.clear();
    console.log('모든 캐시가 삭제되었습니다.');
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

  // GraphQL Search를 사용한 최적화된 채팅방 목록 조회
  async getChatRoomsWithGraphQLSearch(token: string): Promise<ChatRoom[]> {
    console.log('🔍 GraphQL Search를 사용하여 채팅방 목록을 가져오는 중...');
    
    const query = `
      query($query: String!) {
        search(query: $query, type: ISSUE, first: 100) {
          nodes {
            ... on Issue {
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
                  name
                  color
                }
              }
              author {
                login
                avatarUrl
              }
            }
          }
        }
      }
    `;

    const searchQuery = `repo:${this.repoOwner}/${this.repoName} label:chat is:issue is:open`;

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
            query: searchQuery,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL Search request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Search errors: ${JSON.stringify(data.errors)}`);
      }

      const issues = data.data.search.nodes;
      console.log(`📊 GraphQL Search로 ${issues.length}개의 채팅방을 찾았습니다.`);
      
      // ChatRoom 형태로 변환
      const chatRooms = issues.map((issue: any) => {
        return {
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          comments: issue.comments.totalCount,
          created_at: issue.createdAt,
          updated_at: issue.updatedAt,
          html_url: issue.url,
          labels: issue.labels.nodes.map((label: any) => ({
            name: label.name,
            color: label.color,
          })),
          user: {
            id: 0, // GraphQL에서 제공하지 않으므로 기본값
            login: issue.author?.login || 'unknown',
            name: undefined, // GraphQL에서 제공하지 않음
            email: undefined, // GraphQL에서 제공하지 않음
            avatar_url: issue.author?.avatarUrl || '',
            html_url: '', // GraphQL에서 제공하지 않음
          },
          lastMessage: '', // 마지막 메시지 정보 제거
          lastMessageTime: '', // 마지막 메시지 시간 제거
        } as ChatRoom;
      });

      console.log('✅ GraphQL Search를 사용하여 채팅방 목록을 가져왔습니다.');
      return chatRooms;
    } catch (error) {
      console.warn('❌ GraphQL Search failed:', error);
      throw error;
    }
  }

  // GitHub Search API를 사용한 최적화된 채팅방 목록 조회
  async getChatRoomsWithSearchAPI(token: string): Promise<ChatRoom[]> {
    console.log('🔍 GitHub Search API를 사용하여 채팅방 목록을 가져오는 중...');
    
    try {
      // 검색 쿼리: 특정 저장소의 "chat" 라벨이 붙은 열린 이슈들
      const searchQuery = `repo:${this.repoOwner}/${this.repoName} label:chat is:issue is:open`;
      const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=100`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search API request failed: ${response.status}`);
      }

      const searchData = await response.json();
      const issues = searchData.items;
      console.log(`📊 Search API로 ${issues.length}개의 채팅방을 찾았습니다.`);

      if (issues.length === 0) {
        return [];
      }

      // ChatRoom 형태로 변환 (마지막 메시지 정보 없이)
      const chatRooms = issues.map((issue: any) => {
        return {
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          comments: issue.comments,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
          labels: issue.labels.map((label: any) => ({
            name: label.name,
            color: label.color,
          })),
          user: {
            login: issue.user?.login || 'unknown',
            avatar_url: issue.user?.avatar_url || '',
          },
          lastMessage: '', // 마지막 메시지 정보 제거
          lastMessageTime: '', // 마지막 메시지 시간 제거
        } as ChatRoom;
      });

      console.log('✅ GitHub Search API를 사용하여 채팅방 목록을 가져왔습니다.');
      return chatRooms;

    } catch (error) {
      console.warn('❌ Search API failed:', error);
      throw error;
    }
  }
}

export const githubAPI = new GitHubAPI();