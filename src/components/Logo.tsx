import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  invert?: boolean;
}

export default function Logo({ className = '', size = 48, invert = false }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      <div className={`absolute inset-0 bg-brand-primary/10 blur-xl rounded-full ${invert ? 'hidden' : ''}`} />
      <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        className={`relative z-10 transition-transform duration-500 hover:scale-110 ${invert ? 'text-white' : 'text-brand-primary'}`}
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M19.5 22s.5-3 2.5-3 2.5 3 2.5 3" />
        <path d="M14.5 22s.5-3 2.5-3 2.5 3 2.5 3" />
        <path d="M9.5 22s.5-3 2.5-3 2.5 3 2.5 3" />
        <path d="M4.5 22s.5-3 2.5-3 2.5 3 2.5 3" />
        <path d="M12 4.5c4.5 0 9.5 4 9.5 6.5s-2.5 5.5-6.5 5.5c-2.5 0-3-1.5-3-2.5" />
        <path d="M12 4.5c-4.5 0-9.5 4-9.5 6.5s2.5 5.5 6.5 5.5c2.5 0 3-1.5 3-2.5" />
        <path d="M12 4.5v12.5" />
        <path d="M7 8l-4.5 4.5" />
        <path d="M17 8l4.5 4.5" />
        <circle cx="9" cy="8" r="1" fill="currentColor" />
        <circle cx="15" cy="8" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}
