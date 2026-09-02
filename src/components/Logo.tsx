import React from 'react';

/**
 * TQMaster logo — mortarboard (nón tốt nghiệp) trên nền squircle gradient.
 * Thiết kế tối giản, sắc nét ở mọi kích thước.
 */
export const Logo: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="tqLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="52%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="tqLogoGloss" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="tqLogoCap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0f2fe" />
      </linearGradient>
    </defs>

    {/* Nền squircle */}
    <rect width="40" height="40" rx="12" fill="url(#tqLogoBg)" />
    {/* Bóng sáng phía trên */}
    <path d="M0 12C0 5.373 5.373 0 12 0h16c6.627 0 12 5.373 12 12v4C30 22 10 22 0 16V12Z" fill="url(#tqLogoGloss)" />
    {/* Viền trong tinh tế */}
    <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="11.25" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" />

    {/* Mũ tốt nghiệp */}
    <path d="M20 11.5 31.5 16.6 20 21.7 8.5 16.6 20 11.5Z" fill="url(#tqLogoCap)" />
    <path
      d="M13.6 19.1v4.6c0 1.1 2.9 2.6 6.4 2.6s6.4-1.5 6.4-2.6v-4.6"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.92"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Dây tua */}
    <path d="M30.6 17v5.4" fill="none" stroke="#ffffff" strokeOpacity="0.92" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="30.6" cy="23.8" r="1.7" fill="#fde68a" />
  </svg>
);

export default Logo;
