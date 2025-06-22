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

GitHub Issues를 활용한 실시간 채팅 앱입니다. Utterances를 사용하여 GitHub Issues의 댓글을 채팅창처럼 활용할 수 있습니다.

## 🚀 주요 기능

- GitHub App 인증
- 실시간 채팅 (GitHub Issues 댓글 기반)
- Utterances 댓글 시스템
- 반응형 디자인
- 다크/라이트 테마 지원

## 🛠️ 기술 스택

- React 18
- TypeScript
- Vite
- SCSS
- React Router
- GitHub API
- Utterances (댓글 시스템)

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
# GitHub App 설정
VITE_GITHUB_APP_ID=your_github_app_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback

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

## 🔧 GitHub App 설정

### 1. GitHub App 생성
1. [GitHub Developer Settings](https://github.com/settings/apps)에서 새 앱 생성
2. 다음 권한 설정:
   - Repository permissions:
     - Issues: Read & Write
     - Contents: Read
   - User permissions:
     - Email addresses: Read
3. Webhook 설정 (선택사항)
4. 앱 설치

### 2. 환경변수 설정
- `VITE_GITHUB_APP_ID`: GitHub App ID
- `VITE_GITHUB_CLIENT_ID`: GitHub App Client ID

## 💬 Utterances 설정

### 1. Repository 설정
- GitHub Repository에서 Issues 기능이 활성화되어 있어야 함
- Repository가 Public이거나 Utterances 앱이 설치되어 있어야 함

### 2. 환경변수 설정
- `VITE_UTTERANCES_REPO`: "owner/repo" 형식의 저장소명
- `VITE_UTTERANCES_ISSUE_TERM`: 댓글이 연결될 이슈의 제목
- `VITE_UTTERANCES_LABEL`: 이슈에 추가될 라벨 (선택사항)

### 3. Utterances 앱 설치 (Private Repository의 경우)
1. [Utterances GitHub App](https://github.com/apps/utterances) 방문
2. Repository에 앱 설치

## 🎨 사용법

1. 앱에 접속하여 GitHub 계정으로 로그인
2. 채팅창에서 메시지 입력 및 전송
3. 하단의 Utterances 댓글 섹션에서 GitHub Issues와 연동된 댓글 확인
4. GitHub Issues에서 댓글을 작성하면 실시간으로 채팅창에 반영

## 📱 PWA 지원

이 앱은 PWA(Progressive Web App)로 구성되어 있어 모바일에서도 네이티브 앱처럼 사용할 수 있습니다.

## 🎯 주요 컴포넌트

- `ChatPage`: 메인 채팅 페이지
- `UtterancesComments`: GitHub Issues 댓글 컴포넌트
- `AuthContext`: 인증 상태 관리
- `ChatContext`: 채팅 상태 관리

## 🔄 실시간 업데이트

- GitHub Issues의 댓글이 실시간으로 채팅창에 반영됩니다
- 페이지 새로고침 시 최신 댓글을 불러옵니다

## 🛡️ 보안

- GitHub App 토큰은 클라이언트에 안전하게 저장됩니다
- 모든 API 호출은 인증된 사용자만 가능합니다

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
