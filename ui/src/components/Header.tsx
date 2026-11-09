import React from 'react';
import { BeakerIcon, LayersIcon, ArrowRightIcon } from './Icons.tsx';

interface HeaderProps {
  onOpenBatch: () => void;
  isBatchMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBatch, isBatchMode }) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-badge">
          <BeakerIcon size={17} color="#a5b4fc" />
        </div>
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
