import React from 'react';
import { LayersIcon, ArrowRightIcon, GlobeIcon } from './Icons.tsx';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../i18n.tsx';

interface HeaderProps {
  onOpenBatch: () => void;
  isBatchMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBatch, isBatchMode }) => {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <Logo size={32} withGlow={true} />
        <div className="brand-title">
          <h1>{t.brand_title}</h1>
          <span>{t.brand_sub}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Language Switcher */}
        <button
          className="btn btn-secondary-action"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          style={{ padding: '5px 11px', fontSize: '0.78rem', gap: '6px' }}
          title={lang === 'ar' ? 'Switch interface to English' : 'التحويل للغة العربية'}
        >
          <GlobeIcon size={14} color="#38bdf8" />
          <span style={{ fontWeight: 600 }}>{t.lang_toggle_btn}</span>
        </button>

        <span className="pill pill-neutral">
          <span className="status-dot" style={{ backgroundColor: '#10b981' }} />
          {t.local_execution}
        </span>

        <button 
          className="btn btn-secondary-action"
          onClick={onOpenBatch}
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          {isBatchMode ? (
            <>
              <ArrowRightIcon size={14} />
              {t.back_to_scenarios}
            </>
          ) : (
            <>
              <LayersIcon size={14} color="#818cf8" />
              {t.batch_mode_btn}
            </>
          )}
        </button>
      </div>
    </header>
  );
};
