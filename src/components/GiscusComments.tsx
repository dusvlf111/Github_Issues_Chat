import React, { useEffect, useRef } from 'react';

interface GiscusCommentsProps {
  repo: string; // "owner/repo" 형식
  repoId: string; // GitHub GraphQL API의 repository ID
  category: string; // Discussions 카테고리
  categoryId: string; // 카테고리 ID
  mapping: 'pathname' | 'url' | 'title' | 'og:title';
  strict: boolean;
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: 'top' | 'bottom';
  theme: 'light' | 'dark' | 'preferred_color_scheme';
  lang: string;
}

const GiscusComments: React.FC<GiscusCommentsProps> = ({
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  strict = false,
  reactionsEnabled = true,
  emitMetadata = false,
  inputPosition = 'bottom',
  theme = 'preferred_color_scheme',
  lang = 'ko'
}) => {
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', strict ? '1' : '0');
    script.setAttribute('data-reactions-enabled', reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.crossOrigin = 'anonymous';
    script.async = true;

    if (commentsRef.current) {
      commentsRef.current.appendChild(script);
    }

    return () => {
      if (commentsRef.current) {
        const existingScript = commentsRef.current.querySelector('script[src*="giscus"]');
        if (existingScript) {
          existingScript.remove();
        }
      }
    };
  }, [repo, repoId, category, categoryId, mapping, strict, reactionsEnabled, emitMetadata, inputPosition, theme, lang]);

  return (
    <div className="giscus-comments">
      <div ref={commentsRef} />
    </div>
  );
};

export default GiscusComments; 