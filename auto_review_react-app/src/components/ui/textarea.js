
import React from 'react';
import '../../App.css';

export function Textarea({ placeholder, className = '', ...props }) {
  return (
    <textarea
      placeholder={placeholder}
      className={`custom-textarea ${className}`}
      {...props}
    />
  );
}
