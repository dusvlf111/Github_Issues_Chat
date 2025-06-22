import React, { useState, useRef } from 'react';
import Button from '../../../../components/common/Button/Button';
import './MessageInput.scss';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
}) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(content.trim());
      setContent('');
      
      // 텍스트 영역 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter 또는 Cmd+Enter로 전송
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // 텍스트 영역 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // 붙여넣기 시에도 높이 조절
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 0);
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-input__form">
        <div className="message-input__field">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="message-input__textarea"
            rows={1}
            maxLength={65536} // GitHub 댓글 최대 길이
          />
          
          {/* 도구 모음 */}
          <div className="message-input__toolbar">
            <div className="message-input__info">
              <span className="message-input__tip">
                Ctrl+Enter로 전송 • Markdown 지원
              </span>
              <span className="message-input__counter">
                {content.length}/65536
              </span>
            </div>
            
            <div className="message-input__actions">
              {/* 마크다운 도움말 버튼 */}
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => {
                  const helpText = `
## 마크다운 사용법

**굵은 글씨** 또는 __굵은 글씨__
*기울임* 또는 _기울임_
~~취소선~~
\`코드\`

### 제목

- 목록 항목
- 다른 항목

1. 번호 목록
2. 두 번째 항목

[링크](https://github.com)

\`\`\`
코드 블록
\`\`\`
`;
                  setContent(prev => prev + helpText);
                }}
                disabled={disabled || isSending}
                aria-label="마크다운 도움말"
              >
                📝
              </Button>

              {/* 전송 버튼 */}
              <Button
                type="submit"
                variant="primary"
                size="small"
                loading={isSending}
                disabled={!content.trim() || disabled || isSending}
                aria-label="메시지 전송"
              >
                {isSending ? '전송 중...' : '전송'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;