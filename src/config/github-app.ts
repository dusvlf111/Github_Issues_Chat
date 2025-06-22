// GitHub App 설정
export const GITHUB_APP_CONFIG = {
  // GitHub App 기본 정보
  appId: import.meta.env.VITE_GITHUB_APP_ID || '',
  appName: import.meta.env.VITE_GITHUB_APP_NAME || 'github-issues-chat',
  
  // 권한 설정
  permissions: {
    issues: 'write',        // 이슈 읽기/쓰기
    contents: 'read',       // 저장소 내용 읽기
    metadata: 'read',       // 메타데이터 읽기
  },
  
  // 이벤트 설정 (웹훅)
  events: [
    'issues',
    'issue_comment'
  ],
  
  // 설치 URL 생성
  getInstallUrl: (state?: string) => {
    const baseUrl = `https://github.com/apps/${GITHUB_APP_CONFIG.appName}/installations/new`;
    return state ? `${baseUrl}?state=${state}` : baseUrl;
  },
  
  // API 엔드포인트
  api: {
    baseUrl: 'https://api.github.com',
    acceptHeader: 'application/vnd.github.v3+json',
  }
} as const;

// GitHub App 설치 정보
export interface GitHubAppInstallation {
  id: number;
  account: {
    login: string;
    type: string;
  };
  repository_selection: 'all' | 'selected';
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
  permissions: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// GitHub App 토큰 정보
export interface GitHubAppToken {
  token: string;
  expires_at: string;
  permissions: Record<string, string>;
  repository_selection: 'all' | 'selected';
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
}

// 환경변수 검증
export const validateGitHubAppConfig = (): string[] => {
  const errors: string[] = [];
  
  if (!GITHUB_APP_CONFIG.appId) {
    errors.push('VITE_GITHUB_APP_ID 환경 변수가 설정되지 않았습니다.');
  }
  
  return errors;
};

// 개발용 로깅
if (import.meta.env.DEV) {
  console.log('🔧 GitHub App Config:', {
    appId: GITHUB_APP_CONFIG.appId,
    appName: GITHUB_APP_CONFIG.appName,
    permissions: GITHUB_APP_CONFIG.permissions,
  });
} 