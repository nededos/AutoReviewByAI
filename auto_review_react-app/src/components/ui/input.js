
import React from 'react';
import '../../App.css';

export function Input({ type = 'text', placeholder, className = '', ...props }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`custom-input ${className}`}
      {...props}
    />
  );
}
