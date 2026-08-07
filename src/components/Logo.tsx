import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="tqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="tqGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#tqGradient)" />
    {/* Inner border for 3D effect */}
    <rect width="38" height="38" x="1" y="1" rx="9" fill="none" stroke="url(#tqGradientLight)" strokeWidth="1" opacity="0.6" />
    
    {/* TQ text in the center */}
    <text 
      x="20" 
      y="22" 
      fill="#ffffff" 
      fontSize="16" 
      fontWeight="900" 
      fontFamily="'Inter', -apple-system, sans-serif" 
      textAnchor="middle" 
      alignmentBaseline="middle"
      letterSpacing="-1px"
    >
      TQ
    </text>
    
    {/* Graduation cap or spark element */}
    <path d="M27 12L20 9L13 12L20 15L27 12Z" fill="rgba(255, 255, 255, 0.9)" />
    <path d="M15 13.5V17C17 19 23 19 25 17V13.5" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
