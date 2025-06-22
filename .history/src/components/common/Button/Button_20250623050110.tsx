import React from 'react';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    fullWidth && `${baseClass}--full-width`,
    loading && `${baseClass}--loading`,
    disabled && `${baseClass}--disabled`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn__loading">
          <span className="btn__spinner"></span>
          로딩 중...
        </span>
      ) : (
        <>
          {icon && <span className="btn__icon">{icon}</span>}
          <span className="btn__text">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;