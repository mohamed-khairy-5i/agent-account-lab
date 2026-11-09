import React from 'react';
import { LayersIcon, ArrowRightIcon } from './Icons.tsx';
import { Logo } from './Logo.tsx';

interface HeaderProps {
  onOpenBatch: () => void;
  isBatchMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBatch, isBatchMode }) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <Logo size={32} withGlow={true} />
        <div className="brand-title">
          <h1>Agent Account Lab</h1>
          <span>حساب مين؟</span>
        </div>
      </div>

      <div className="header-actions">
        <span className="pill pill-neutral">
          <span className="status-dot" style={{ backgroundColor: '#10b981' }} />
          تشغيل محلي بالكامل
        </span>

        <button 
          className="btn btn-secondary-action"
          onClick={onOpenBatch}
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          {isBatchMode ? (
            <>
              <ArrowRightIcon size={14} />
              العودة للسيناريوهات
            </>
          ) : (
            <>
              <LayersIcon size={14} color="#818cf8" />
              المحاكاة الشاملة (100 حالة)
            </>
          )}
        </button>
      </div>
    </header>
  );
};
