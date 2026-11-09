import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', withGlow = true }) => {
  return (
    <div 
      className={`logo-container ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        position: 'relative', 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {withGlow && (
        <div 
          style={{
            position: 'absolute',
            inset: '-10%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
            filter: 'blur(4px)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1, display: 'block' }}
      >
        <defs>
          <linearGradient id="grad-personal" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="grad-work" x1="28" y1="28" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <linearGradient id="grad-core" x1="24" y1="24" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Frame Badge */}
        <rect 
          x="3" 
          y="3" 
          width="58" 
          height="58" 
          rx="14" 
          fill="#131316" 
          stroke="#27272a" 
          strokeWidth="1.5" 
        />

        {/* Account 1 (Personal) - Top Left Ring */}
        <circle 
          cx="26" 
          cy="26" 
          r="13" 
          stroke="url(#grad-personal)" 
          strokeWidth="2.75" 
          strokeDasharray="4 2"
          opacity="0.9"
        />
        <circle cx="26" cy="22" r="3.5" fill="#38bdf8" />
        <path d="M19 32C19 28.5 22 27 26 27C30 27 33 28.5 33 32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

        {/* Account 2 (Work) - Bottom Right Ring */}
        <circle 
          cx="38" 
          cy="38" 
          r="13" 
          stroke="url(#grad-work)" 
          strokeWidth="2.75" 
          opacity="0.95"
        />
        <circle cx="38" cy="34" r="3.5" fill="#818cf8" />
        <path d="M31 44C31 40.5 34 39 38 39C42 39 45 40.5 45 44" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />

        {/* Disambiguation Reticle / Target Prism (Center Intersection) */}
        <g filter="url(#subtle-shadow)">
          <path 
            d="M32 17V21M32 43V47M17 32H21M43 32H47" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          <polygon 
            points="32,26 38,32 32,38 26,32" 
            fill="url(#grad-core)" 
            stroke="#6ee7b7" 
            strokeWidth="1.25"
          />
          <circle cx="32" cy="32" r="2.2" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};
