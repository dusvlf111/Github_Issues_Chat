import React from 'react';
import './Loading.scss';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'medium', message }) => {
  return (
    <div className={`loading loading--${size}`}>
      <div className="loading__spinner"></div>
      {message && <p className="loading__message">{message}</p>}
    </div>
  );
};

export default Loading;