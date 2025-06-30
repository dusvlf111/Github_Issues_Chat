import React, { useState } from 'react';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import Loading from '../../common/Loading/Loading';
import './ChatRoomForm.scss';

interface ChatRoomFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    title: string;
    body?: string;
  };
  onSubmit: (data: { title: string; body?: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ChatRoomForm: React.FC<ChatRoomFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  const validateForm = () => {
    const newErrors: { title?: string; body?: string } = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (title.length > 100) {
      newErrors.title = '제목은 100자 이하여야 합니다.';
    }

    if (body && body.length > 1000) {
      newErrors.body = '설명은 1000자 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim() || undefined,
      });
    } catch (error) {
      console.error('채팅방 저장 중 오류:', error);
    }
  };

  return (
    <form className="chat-room-form" onSubmit={handleSubmit}>
      <div className="form-content">
        {mode === 'create' && (
          <div className="form-info">
            <div className="info-title">새 채팅방 만들기</div>
            <p className="info-text">
              새로운 채팅방을 생성합니다. 제목은 필수이며, 설명은 선택사항입니다.
            </p>
          </div>
        )}

        <Input
          label="채팅방 제목"
          type="text"
          placeholder="채팅방 제목을 입력하세요"
          value={title}
          onChange={setTitle}
          error={errors.title}
          required
          disabled={loading}
        />

        <div className="description-field">
          <Input
            label="설명 (선택사항)"
            type="textarea"
            placeholder="채팅방에 대한 설명을 입력하세요"
            value={body}
            onChange={setBody}
            error={errors.body}
            helpText="채팅방의 목적이나 주제에 대해 간단히 설명해주세요."
            disabled={loading}
            rows={4}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <Loading size="small" />
          ) : mode === 'create' ? (
            '채팅방 만들기'
          ) : (
            '수정하기'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatRoomForm; 