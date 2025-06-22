export const UTTERANCES_CONFIG = {
  repo: import.meta.env.VITE_UTTERANCES_REPO || 'dusvlf111/Github_Issues_Chat',
  issueTerm: import.meta.env.VITE_UTTERANCES_ISSUE_TERM || 'GitHub Issues Chat - 댓글',
  label: import.meta.env.VITE_UTTERANCES_LABEL || 'chat-comments',
  theme: 'preferred-color-scheme' as const,
  crossorigin: 'anonymous' as const,
};

// Utterances 설정 방법:
// 1. GitHub Repository에서 Issues 기능이 활성화되어 있어야 함
// 2. Repository가 Public이거나 Utterances 앱이 설치되어 있어야 함
// 3. issueTerm: 댓글이 연결될 이슈의 제목 (없으면 자동 생성)
// 4. label: 이슈에 추가될 라벨 (선택사항)

export const getUtterancesConfig = () => {
  return {
    ...UTTERANCES_CONFIG,
    // 동적으로 현재 페이지 경로를 사용할 수도 있음
    issueTerm: `${UTTERANCES_CONFIG.issueTerm} - ${window.location.pathname}`,
  };
}; 