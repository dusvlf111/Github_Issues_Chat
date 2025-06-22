export const GISCUS_CONFIG = {
  repo: import.meta.env.VITE_GISCUS_REPO || 'dusvlf111/Github_Issues_Chat',
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || 'R_kgDOLQXXXXX',
  category: import.meta.env.VITE_GISCUS_CATEGORY || 'Announcements',
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || 'DIC_kwDOLQXXXXX',
  mapping: 'pathname' as const,
  strict: false,
  reactionsEnabled: true,
  emitMetadata: false,
  inputPosition: 'bottom' as const,
  theme: 'preferred_color_scheme' as const,
  lang: 'ko',
};

// Repository ID와 Category ID를 찾는 방법:
// 1. Repository ID: https://giscus.app/ 에서 설정할 때 자동으로 표시됨
// 2. Category ID: GitHub Discussions에서 카테고리를 생성한 후 GraphQL로 조회
//    또는 giscus 설정 페이지에서 자동으로 표시됨

export const getGiscusConfig = () => {
  return {
    ...GISCUS_CONFIG,
    // 동적으로 현재 페이지 경로를 사용
    mapping: window.location.pathname,
  };
}; 