import React from 'react';
import type { Scenario, TestCase } from '../../../src/types.ts';
import { type AgentChoice, isLiveLLM } from '../engine.ts';
import { PlayIcon, RefreshIcon, KeyIcon, AlertTriangleIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface ScenarioViewerProps {
  scenario: Scenario;
  cases: TestCase[];
  selectedVariant: string;
  onVariantChange: (variant: string) => void;
  selectedAgent: AgentChoice;
  onAgentChange: (agent: AgentChoice) => void;
  onRun: () => void;
  isRunning: boolean;
  onQuickCompare: () => void;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
}

const VARIANT_NAMES: Record<string, { ar: string; en: string }> = {
  base: { ar: 'الترتيب الأصلي (Base)', en: 'Original Order (Base)' },
  reverse_accounts: { ar: 'عكس ترتيب الحسابات (Reverse Accounts)', en: 'Reverse Accounts Order' },
  flip_default: { ar: 'قلب الحساب الافتراضي (Flip Default)', en: 'Flip Default Account' },
  reverse_files: { ar: 'عكس ترتيب الملفات (Reverse Files)', en: 'Reverse Files Order' },
  add_decoy: { ar: 'حقن حساب تمويه ثالث (Add Decoy)', en: 'Inject Decoy Account' }
};

export const ScenarioViewer: React.FC<ScenarioViewerProps> = ({
  scenario,
  cases,
  selectedVariant,
  onVariantChange,
  selectedAgent,
  onAgentChange,
  onRun,
  isRunning,
  onQuickCompare,
  hasApiKey,
  onOpenApiKeyModal
}) => {
  const { lang, t, getScenarioTitle, getScenarioPrompt } = useLanguage();
  const title = getScenarioTitle(scenario.id, scenario.title_ar);
  const prompt = getScenarioPrompt(scenario.id, scenario.messages[0]?.content || '');
  const needsApiKey = isLiveLLM(selectedAgent) && !hasApiKey;

  return (
    <div className="ui-card">
      <div className="ui-card-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span className="pill pill-neutral font-mono">{scenario.id}</span>
            <span className="pill pill-neutral">{scenario.category}</span>
          </div>
          <h2 className="ui-card-title">{title}</h2>
        </div>

        <div style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div>{t.target_account} <code style={{ color: '#818cf8' }}>{scenario.oracle.target_account_id}</code></div>
          <div>{t.target_operation} <code style={{ color: '#34d399' }}>{scenario.oracle.operation}</code></div>
        </div>
      </div>

      <div className="prompt-container">
        <div className="prompt-label">{t.prompt_label}</div>
        <div className="prompt-text">"{prompt}"</div>
      </div>

      <div className="toolbar-row">
        <div className="toolbar-group">
          <label className="toolbar-label">{t.variant_label}</label>
          <select 
            className="select-clean"
            value={selectedVariant}
            onChange={(e) => onVariantChange(e.target.value)}
          >
            {cases.map(c => (
              <option key={c.variant} value={c.variant}>
                {VARIANT_NAMES[c.variant] ? VARIANT_NAMES[c.variant][lang] : c.variant}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">{t.agent_label}</label>
          <select 
            className="select-clean"
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value as AgentChoice)}
          >
            <optgroup label={lang === 'ar' ? '⚡ نماذج ذكاء اصطناعي حقيقية (Live Frontier APIs)' : '⚡ Frontier AI Models (Live APIs)'}>
              <option value="glm-5.3-flash">{lang === 'ar' ? '🥇 GLM-5.3 Flash (88% نجاح)' : '🥇 GLM-5.3 Flash (88% Score)'}</option>
              <option value="kimi-k3">{lang === 'ar' ? '🥈 Kimi K3 (71% (7 حالات مقيمة))' : '🥈 Kimi K3 (71% (7 cases eval))'}</option>
              <option value="deepseek-v4.1-flash">{lang === 'ar' ? '🥉 DeepSeek V4.1 Flash (67% (6 حالات مقيمة))' : '🥉 DeepSeek V4.1 Flash (67% (6 cases eval))'}</option>
              <option value="qwen-3.8-max">{lang === 'ar' ? '4 Qwen 3.8 MAX (67% (6 حالات مقيمة))' : '4 Qwen 3.8 MAX (67% (6 cases eval))'}</option>
              <option value="gemini-3.8-flash">{lang === 'ar' ? '5 Gemini 3.8 Flash (25% نجاح)' : '5 Gemini 3.8 Flash (25% Score)'}</option>
            </optgroup>
            <optgroup label={lang === 'ar' ? '🛠️ ضوابط ومرجع المختبر (Scripted Controls)' : '🛠️ Scripted Baseline Controls'}>
              <option value="first_account">{lang === 'ar' ? 'ضابط سلبي: أول حساب (First Account)' : 'Negative Control: First Account'}</option>
              <option value="default_account">{lang === 'ar' ? 'ضابط سلبي: الحساب الافتراضي (Default Account)' : 'Negative Control: Default Account'}</option>
              <option value="oracle-reference">{lang === 'ar' ? 'المرجع الاختباري (Oracle Reference)' : 'Ground-Truth Oracle Reference'}</option>
            </optgroup>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary-action"
            onClick={onQuickCompare}
            title={lang === 'ar' ? 'مقارنة فورية لمعرفة أثر عكس ترتيب الحسابات' : 'Instant comparison to test account order inversion'}
          >
            <RefreshIcon size={13} />
            {t.compare_order_btn}
          </button>

          <button 
            className="btn btn-primary-action"
            onClick={needsApiKey ? onOpenApiKeyModal : onRun}
            disabled={isRunning}
          >
            <PlayIcon size={12} color="#fff" />
            {isRunning ? t.running_btn : t.run_btn}
          </button>
        </div>
      </div>

      {needsApiKey && (
        <div className="api-key-warning-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangleIcon size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
              {t.api_key_banner_warning}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary-action"
            onClick={onOpenApiKeyModal}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '5px' }}
          >
            <KeyIcon size={12} color="#f59e0b" />
            <span>{t.api_key_banner_btn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
