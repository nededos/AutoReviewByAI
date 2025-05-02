
import React from 'react';
import '../../App.css';

export function Button({ children, className = '', onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`custom-button ${className}`}
    >
      {children}
    </button>
  );
}
