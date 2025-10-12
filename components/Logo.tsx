import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        className={className}
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="currentColor"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <rect 
            width="100" 
            height="100" 
            rx="20" 
            fill="none" 
            stroke="url(#logoGradient)" 
            strokeWidth="6" 
        />
        <path 
            d="M25 30 H 75 V 42 H 25 Z" 
            fill="url(#logoGradient)" 
        />
        <path 
            d="M44 42 H 56 V 75 H 44 Z" 
            fill="url(#logoGradient)"
        />
    </svg>
);
