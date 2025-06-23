# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# GitHub Issues Chat

GitHub Issues를 백엔드로 사용하는 **그룹채팅방** 앱입니다. GitHub Personal Access Token으로 간편하게 로그인하여 바로 채팅에 참여할 수 있으며, 모든 메시지는 GitHub Issues의 댓글로 저장됩니다.

## 🚀 주요 기능

- **그룹채팅방 UI**: 카카오톡, 슬랙과 같은 현대적인 채팅 인터페이스
- **GitHub Issues 백엔드**: 모든 메시지가 GitHub Issues 댓글로 저장
- **간편한 인증**: Personal Access Token으로 즉시 로그인
- **실시간 동기화**: GitHub Issues에서 댓글을 작성하면 채팅창에 실시간 반영
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **다크/라이트 테마**: 사용자 선호도에 따른 테마 자동 전환

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS
- **Routing**: React Router
- **Backend**: GitHub Issues API
- **Authentication**: GitHub Personal Access Token
- **Comments**: Utterances (GitHub Issues 연동)

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/dusvlf111/Github_Issues_Chat.git
cd Github_Issues_Chat
```

### 2. 의존성 설치
```bash
npm install --legacy-peer-deps
```

### 3. 환경변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# GitHub Repository 설정 (Issues 댓글용)
VITE_GITHUB_REPO_OWNER=dusvlf111
VITE_GITHUB_REPO_NAME=Github_Issues_Chat
VITE_GITHUB_ISSUE_NUMBER=1

# Utterances 설정 (GitHub Issues 기반 댓글)
VITE_UTTERANCES_REPO=dusvlf111/Github_Issues_Chat
VITE_UTTERANCES_ISSUE_TERM=GitHub Issues Chat - 댓글
VITE_UTTERANCES_LABEL=chat-comments

# 앱 설정
VITE_APP_NAME=GitHub Issues Chat
VITE_APP_DESCRIPTION=GitHub Issues를 활용한 실시간 채팅 앱
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 🔧 설정 방법

### 1. GitHub Repository 설정
1. GitHub Repository에서 Issues 기능이 활성화되어 있어야 함
2. 채팅용 Issue 생성 (예: "GitHub Issues Chat - 댓글")
3. Issue 번호를 환경변수에 설정

### 2. Personal Access Token 발급
1. [GitHub.com](https://github.com) → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token → Generate new token (classic)
4. 권한 설정:
   - **Note**: "GitHub Issues Chat"
   - **Expiration**: 90 days (또는 원하는 기간)
   - **Scopes**: `repo` (전체 저장소 접근), `user` (사용자 정보)
5. Generate token 클릭
6. 생성된 토큰을 안전하게 보관

### 3. 환경변수 설정
- `VITE_GITHUB_REPO_OWNER`: Repository 소유자
- `VITE_GITHUB_REPO_NAME`: Repository 이름
- `VITE_GITHUB_ISSUE_NUMBER`: 채팅용 Issue 번호

## 💬 채팅 시스템

### 채팅 방식
- **UI**: 그룹채팅방 형태 (카카오톡, 슬랙 스타일)
- **백엔드**: GitHub Issues 댓글 시스템
- **실시간성**: 페이지 새로고침 시 최신 댓글 동기화

### 메시지 저장
- 모든 채팅 메시지는 GitHub Issues의 댓글로 저장
- GitHub 계정으로 작성된 댓글은 자동으로 채팅창에 표시
- 메시지 작성자, 시간, 아바타 정보 포함

## 🎨 UI/UX 특징

### 그룹채팅방 디자인
- **메시지 버블**: 사용자별 구분된 메시지 버블
- **아바타**: GitHub 프로필 이미지 표시
- **시간 표시**: 각 메시지의 작성 시간
- **온라인 상태**: 채팅방 참여자 수 표시

### 반응형 디자인
- **모바일**: 터치 친화적 인터페이스
- **태블릿**: 최적화된 레이아웃
- **데스크톱**: 넓은 화면 활용

## 🔄 실시간 동기화

### 동작 방식
1. 사용자가 채팅창에서 메시지 전송
2. GitHub Issues API를 통해 댓글 작성
3. 채팅창에 즉시 메시지 표시
4. 다른 사용자도 GitHub Issues에서 댓글 확인 가능

### 새로고침 동기화
- 페이지 새로고침 시 GitHub Issues에서 최신 댓글 가져오기
- 기존 채팅 히스토리 복원

## 🛡️ 보안

- **Personal Access Token**: GitHub의 공식 인증 시스템
- **토큰 관리**: 클라이언트에 안전하게 저장
- **권한 제한**: 필요한 최소 권한만 요청
- **토큰 만료**: 자동 로그아웃 처리

## 📱 PWA 지원

이 앱은 PWA(Progressive Web App)로 구성되어 있어 모바일에서도 네이티브 앱처럼 사용할 수 있습니다.

## 🎯 주요 컴포넌트

- `ChatPage`: 메인 채팅 페이지 (그룹채팅방 UI)
- `UtterancesComments`: GitHub Issues 댓글 표시
- `AuthContext`: Personal Access Token 인증 관리
- `ChatContext`: 채팅 상태 및 메시지 관리

## 🔄 배포

### GitHub Pages
```bash
npm run deploy
```

### Vercel/Netlify
- 저장소 연결 후 자동 배포
- 환경변수 설정 필요

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

문제가 있거나 개선사항이 있다면 GitHub Issues를 통해 문의해주세요!
