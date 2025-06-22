import React from 'react';
import './Loading.scss';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  message,
  className = '',
}) => {
  const baseClass = 'loading';
  const classes = [
    baseClass,
    `${baseClass}--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="loading__spinner">
        <div className="loading__circle"></div>
      </div>
      {message && (
        <p className="loading__message">{message}</p>
      )}
    </div>
  );
};

export default Loading;