import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', withGlow = true }) => {
  const borderRadius = Math.max(6, Math.round(size * 0.22));

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
            inset: '-15%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(6,182,212,0.2) 50%, transparent 70%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }}
        />
      )}
      <img
        src="/logo.png"
        alt="Agent Account Lab Logo"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: `${borderRadius}px`,
          objectFit: 'cover',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1,
          display: 'block'
        }}
      />
    </div>
  );
};
