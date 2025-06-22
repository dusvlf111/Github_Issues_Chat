// GitHub Pages URL에서 저장소 정보 자동 추출
function getRepositoryInfoFromURL(): { owner: string; name: string } {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
  
    // GitHub Pages 패턴 감지
    if (hostname.endsWith('.github.io')) {
      const owner = hostname.replace('.github.io', '');
      
      // pathname에서 저장소명 추출
      const pathParts = pathname.split('/').filter(part => part);
      const name = pathParts[0] || owner;
      
      return { owner, name };
    }
    
    // 로컬 개발 환경이거나 커스텀 도메인인 경우
    return {
      owner: import.meta.env.VITE_GITHUB_REPO_OWNER || 'your-username',
      name: import.meta.env.VITE_GITHUB_REPO_NAME || 'your-repo-name'
    };
  }
  
  const repoInfo = getRepositoryInfoFromURL();
  
  export const APP_CONFIG = {
    // 앱 기본 정보
    name: 'GitHub Issues Chat',
    description: '이 저장소의 이슈를 활용한 실시간 채팅',
    version: '1.0.0',
    
    // GitHub 설정
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
      redirectUri: `${window.location.origin}`,
      scope: 'public_repo user:email',
      apiBaseUrl: 'https://api.github.com',
      
      // 현재 저장소 정보
      repository: {
        owner: repoInfo.owner,
        name: repoInfo.name,
      },
      
      // 채팅방으로 사용할 이슈 번호
      issueNumber: parseInt(import.meta.env.VITE_GITHUB_ISSUE_NUMBER || '1'),
    },
    
    // 채팅 설정
    chat: {
      refreshInterval: 30000, // 30초마다 새 메시지 확인
      messagesPerPage: 50,
      autoScroll: true,
      enableMarkdown: true,
    },
    
    // 라우트 경로
    routes: {
      login: '/',
      chat: '/chat',
    },
    
    // 로컬 스토리지 키
    storage: {
      authToken: 'github_token',
      userData: 'user_data',
      themeMode: 'theme_mode',
      lastMessageId: 'last_message_id',
    },
    
    // 메시지
    errors: {
      network: '네트워크 연결을 확인해주세요.',
      unauthorized: '로그인이 필요합니다.',
      forbidden: '이 저장소에 접근 권한이 없습니다.',
      notFound: '이슈를 찾을 수 없습니다.',
      rateLimit: 'API 호출 한도를 초과했습니다.',
      issueNotFound: `이슈 #${parseInt(import.meta.env.VITE_GITHUB_ISSUE_NUMBER || '1')}을 찾을 수 없습니다.`,
    },
    
    messages: {
      loginSuccess: '로그인되었습니다.',
      logoutSuccess: '로그아웃되었습니다.',
      messageSent: '메시지가 전송되었습니다.',
      messageUpdated: '메시지가 수정되었습니다.',
      messageDeleted: '메시지가 삭제되었습니다.',
    },
  } as const;
  
  // 환경변수 검증
  export const validateConfig = (): string[] => {
    const errors: string[] = [];
    
    if (!APP_CONFIG.github.repository.owner || APP_CONFIG.github.repository.owner === 'your-username') {
      errors.push('GitHub 저장소 소유자 정보를 확인할 수 없습니다.');
    }
    
    if (!APP_CONFIG.github.repository.name || APP_CONFIG.github.repository.name === 'your-repo-name') {
      errors.push('GitHub 저장소 이름을 확인할 수 없습니다.');
    }
    
    if (!APP_CONFIG.github.issueNumber || isNaN(APP_CONFIG.github.issueNumber)) {
      errors.push('VITE_GITHUB_ISSUE_NUMBER가 올바르지 않습니다.');
    }
    
    return errors;
  };
  
  // 현재 저장소 정보 로깅 (개발용)
  if (import.meta.env.DEV) {
    console.log('🔧 Repository Info:', {
      owner: APP_CONFIG.github.repository.owner,
      name: APP_CONFIG.github.repository.name,
      issueNumber: APP_CONFIG.github.issueNumber,
    });
  }