import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        {/* Modern Geometric Elephant Pictorial */}
        <path
          d="M15 45C15 30 25 20 50 20C75 20 85 30 85 45C85 60 75 70 50 70C25 70 15 60 15 45Z"
          fill="currentColor"
          className="text-brand-primary"
        />
        {/* Large Ears / Sound waves */}
        <path
          d="M15 45C5 45 0 35 5 25C10 15 15 15 15 15"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-brand-primary/40"
        />
        <path
          d="M85 45C95 45 100 35 95 25C90 15 85 15 85 15"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-brand-primary/40"
        />
        {/* Digital Core eye */}
        <circle cx="35" cy="40" r="3" fill="white" />
        <circle cx="65" cy="40" r="3" fill="white" />
        
        {/* Symbolic Trunk / Tech Line */}
        <path
          d="M50 70V82C50 88 55 90 60 90"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-brand-primary"
        />
        
        {/* Circuit Pattern inside body */}
        <path
          d="M30 55H70M40 48H60"
          stroke="white"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
