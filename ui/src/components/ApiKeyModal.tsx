import React, { useState, useEffect } from 'react';
import { KeyIcon, LockIcon, EyeIcon, EyeOffIcon, CheckCircleIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState<string>('');
  const [baseURL, setBaseURL] = useState<string>('/api/llm');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('APINEX_API_KEY') || '';
      const storedURL = localStorage.getItem('APINEX_BASE_URL') || '/api/llm';
      setApiKey(storedKey);
      setBaseURL(storedURL);
      setHasExistingKey(!!storedKey.trim());
      setJustSaved(false);
      setUrlError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    const trimmedURL = baseURL.trim() || '/api/llm';

    if (trimmedURL && trimmedURL !== '/api/llm') {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmedURL);
      const isHttps = /^https:\/\//i.test(trimmedURL);
      if (!isLocalhost && !isHttps) {
        setUrlError('يجب استخدام بروتوكول https:// للمزودات الخارجية لحماية المفتاح المشفر (أو http://localhost)');
        return;
      }
    }
    setUrlError(null);

    if (trimmedKey) {
      localStorage.setItem('APINEX_API_KEY', trimmedKey);
      setHasExistingKey(true);
    } else {
      localStorage.removeItem('APINEX_API_KEY');
      setHasExistingKey(false);
    }

    if (trimmedURL && trimmedURL !== '/api/llm') {
      localStorage.setItem('APINEX_BASE_URL', trimmedURL);
    } else {
      localStorage.removeItem('APINEX_BASE_URL');
    }

    onKeySaved(trimmedKey);
    setJustSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRemove = () => {
    localStorage.removeItem('APINEX_API_KEY');
    localStorage.removeItem('APINEX_BASE_URL');
    setApiKey('');
    setBaseURL('/api/llm');
    setHasExistingKey(false);
    onKeySaved('');
  };

  const maskedPreview = apiKey.trim()
    ? `${apiKey.trim().slice(0, 7)}••••••••${apiKey.trim().slice(-4)}`
    : '';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-badge-indigo">
              <KeyIcon size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {t.api_key_modal_title}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {t.api_key_modal_sub}
              </p>
            </div>
          </div>
          <button 
            className="btn-icon-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          
          {/* Security Notice */}
          <div className="security-notice-box">
            <LockIcon size={15} color="#10b981" />
            <span style={{ fontSize: '0.78rem', color: '#a7f3d0', lineHeight: 1.4 }}>
              {t.api_key_security_notice}
            </span>
          </div>

          {/* Key Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>حالة المفتاح (Status):</span>
            {hasExistingKey ? (
              <span className="pill pill-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircleIcon size={12} color="#10b981" />
                {t.api_key_configured_badge}
              </span>
            ) : (
              <span className="pill pill-amber">
                {t.api_key_missing_badge}
              </span>
            )}
          </div>

          {/* API Key Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.api_key_input_label}</span>
              {hasExistingKey && maskedPreview && (
                <code style={{ fontSize: '0.75rem', color: '#818cf8' }}>{maskedPreview}</code>
              )}
            </label>
            <div className="input-with-actions">
              <input 
                type={showKey ? 'text' : 'password'}
                className="input-clean font-mono"
                placeholder={t.api_key_input_placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="button"
                className="btn-input-addon"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
                tabIndex={-1}
              >
                {showKey ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ fontSize: '0.78rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showAdvanced ? '▲ إخفاء الإعدادات المتقدمة' : '▼ إعدادات متقدمة (Custom Endpoint)'}
            </button>
            {showAdvanced && (
              <div style={{ marginTop: '8px' }}>
                <label className="form-label">{t.api_key_endpoint_label}</label>
                <input 
                  type="text"
                  className="input-clean font-mono"
                  placeholder="/api/llm"
                  value={baseURL}
                  onChange={(e) => {
                    setBaseURL(e.target.value);
                    setUrlError(null);
                  }}
                  style={{ fontSize: '0.85rem' }}
                />
                {urlError && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '4px', display: 'block' }}>
                    ⚠️ {urlError}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  {t.api_key_endpoint_hint}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {hasExistingKey && (
              <button
                type="button"
                className="btn btn-danger-action"
                onClick={handleRemove}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {t.api_key_remove_btn}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary-action"
              onClick={onClose}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {t.api_key_cancel_btn}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ fontSize: '0.82rem', padding: '6px 16px', gap: '6px' }}
            >
              {justSaved ? (
                <>
                  <CheckCircleIcon size={14} color="#ffffff" />
                  <span>تم الحفظ!</span>
                </>
              ) : (
                <>
                  <KeyIcon size={14} />
                  <span>{t.api_key_save_btn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
