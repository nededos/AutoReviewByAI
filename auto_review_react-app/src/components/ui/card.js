
import React from 'react';
import '../../App.css';

export function Card({ children, className = '' }) {
  return <div className={`custom-card ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`custom-card-content ${className}`}>{children}</div>;
}
