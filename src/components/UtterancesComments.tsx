import React, { useEffect, useRef } from 'react';

interface UtterancesCommentsProps {
  repo: string; // "owner/repo" 형식
  issueTerm: string; // 이슈 제목으로 사용할 텍스트
  issueNumber?: number; // 특정 이슈 번호 (선택사항)
  label?: string; // 이슈 라벨 (선택사항)
  theme?: 'github-light' | 'github-dark' | 'preferred-color-scheme';
  crossorigin?: string;
}

const UtterancesComments: React.FC<UtterancesCommentsProps> = ({
  repo,
  issueTerm,
  issueNumber,
  label,
  theme = 'preferred-color-scheme',
  crossorigin = 'anonymous'
}) => {
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', repo);
    script.setAttribute('issue-term', issueTerm);
    
    if (issueNumber) {
      script.setAttribute('issue-number', issueNumber.toString());
    }
    
    if (label) {
      script.setAttribute('label', label);
    }
    
    script.setAttribute('theme', theme);
    script.setAttribute('crossorigin', crossorigin);
    script.async = true;

    if (commentsRef.current) {
      commentsRef.current.appendChild(script);
    }

    return () => {
      if (commentsRef.current) {
        const existingScript = commentsRef.current.querySelector('script[src*="utteranc"]');
        if (existingScript) {
          existingScript.remove();
        }
      }
    };
  }, [repo, issueTerm, issueNumber, label, theme, crossorigin]);

  return (
    <div className="utterances-comments">
      <div ref={commentsRef} />
    </div>
  );
};

export default UtterancesComments; 