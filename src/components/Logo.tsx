import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  invert?: boolean;
}

export default function Logo({ className = '', size = 48, invert = false }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Minimalist Ancestral Icon - Geometric Shield/Mask */}
        <path
          d="M50 10L85 30V70L50 90L15 70V30L50 10Z"
          stroke="currentColor"
          strokeWidth="4"
          className={invert ? "text-white" : "text-brand-primary"}
        />
        <path
          d="M50 25C60 25 65 30 65 40V60C65 70 60 75 50 75C40 75 35 70 35 60V40C35 30 40 25 50 25Z"
          fill="currentColor"
          className={invert ? "text-white/20" : "text-brand-primary/10"}
        />
        <path
          d="M50 35V65M40 50H60"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className={invert ? "text-white" : "text-brand-primary"}
        />
        <path
          d="M15 30L50 50L85 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
          className={invert ? "text-white" : "text-brand-primary"}
        />
      </svg>
    </div>
  );
}
