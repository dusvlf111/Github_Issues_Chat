import React from 'react';
import Button from '../Button/Button';
import './ErrorMessage.scss';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`error-message ${className}`}>
      <div className="error-message__icon">⚠️</div>
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <Button 
          variant="secondary" 
          size="small" 
          onClick={onRetry}
          className="error-message__retry"
        >
          다시 시도
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;