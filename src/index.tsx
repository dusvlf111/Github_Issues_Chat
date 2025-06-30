import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA 설치 프롬프트 처리
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // 기본 설치 프롬프트 방지
  e.preventDefault();
  // 나중에 사용하기 위해 이벤트 저장
  deferredPrompt = e;
  
  // 커스텀 설치 버튼 표시 로직 (선택사항)
  console.log('PWA 설치 가능');
});

window.addEventListener('appinstalled', () => {
  console.log('PWA가 설치되었습니다');
  deferredPrompt = null;
});

// 앱 렌더링
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);