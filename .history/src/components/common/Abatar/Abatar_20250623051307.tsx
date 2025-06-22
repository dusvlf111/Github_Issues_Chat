import React from 'react';
import './Avatar.scss';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'medium',
  className = '',
}) => {
  const baseClass = 'avatar';
  const classes = [
    baseClass,
    `${baseClass}--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <img
        src={src}
        alt={alt}
        className="avatar__image"
        loading="lazy"
      />
    </div>
  );
};

export default Avatar;