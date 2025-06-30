import React from 'react';
import './Input.scss';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  rows = 4,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: 'var(--error-color)' }}> *</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          className={`input-field ${error ? 'error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          className={`input-field ${error ? 'error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
      {helpText && <div className="help-text">{helpText}</div>}
    </div>
  );
};

export default Input; 