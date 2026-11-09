import React from 'react';
import type { Scenario, TestCase } from '../../../src/types.ts';
import type { AgentChoice } from '../engine.ts';
import { PlayIcon, RefreshIcon } from './Icons.tsx';

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
}

const VARIANT_NAMES: Record<string, string> = {
  base: 'الترتيب الأصلي (Base)',
  reverse_accounts: 'عكس ترتيب الحسابات (Reverse Accounts)',
  flip_default: 'قلب الحساب الافتراضي (Flip Default)',
  reverse_files: 'عكس ترتيب الملفات (Reverse Files)',
  add_decoy: 'حقن حساب تمويه ثالث (Add Decoy)'
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
  onQuickCompare
}) => {
  return (
    <div className="ui-card">
      <div className="ui-card-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span className="pill pill-neutral font-mono">{scenario.id}</span>
            <span className="pill pill-neutral">{scenario.category}</span>
          </div>
          <h2 className="ui-card-title">{scenario.title_ar}</h2>
        </div>

        <div style={{ textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div>الحساب المستهدف: <code style={{ color: '#818cf8' }}>{scenario.oracle.target_account_id}</code></div>
          <div>العملية المطلوبة: <code style={{ color: '#34d399' }}>{scenario.oracle.operation}</code></div>
        </div>
      </div>

      <div className="prompt-container">
        <div className="prompt-label">نص طلب المستخدم (Simulated User Prompt)</div>
        <div className="prompt-text">"{scenario.messages[0]?.content}"</div>
      </div>

      <div className="toolbar-row">
        <div className="toolbar-group">
          <label className="toolbar-label">تنويعة الحالة:</label>
          <select 
            className="select-clean"
            value={selectedVariant}
            onChange={(e) => onVariantChange(e.target.value)}
          >
            {cases.map(c => (
              <option key={c.variant} value={c.variant}>
                {VARIANT_NAMES[c.variant] || c.variant}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">الوكيل / النموذج:</label>
          <select 
            className="select-clean"
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value as AgentChoice)}
          >
            <optgroup label="⚡ نماذج ذكاء اصطناعي حقيقية (Live Frontier APIs)">
              <option value="glm-5.3-flash">🥇 GLM-5.3 Flash (75% Score — متصدر التقييم)</option>
              <option value="kimi-k3">🥈 Kimi K3 (63% Score)</option>
              <option value="deepseek-v4.1-flash">🥉 DeepSeek V4.1 Flash (50% Score)</option>
              <option value="qwen-3.8-max">⚡ Qwen 3.8 MAX (50% Score)</option>
              <option value="gemini-3.8-flash">✨ Gemini 3.8 Flash (44% Score)</option>
            </optgroup>
            <optgroup label="🛠️ ضوابط ومرجع المختبر (Scripted Controls)">
              <option value="first_account">ضابط سلبي: أول حساب (First Account)</option>
              <option value="default_account">ضابط سلبي: الحساب الافتراضي (Default Account)</option>
              <option value="oracle-reference">المرجع الاختباري (Oracle Reference)</option>
            </optgroup>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary-action"
            onClick={onQuickCompare}
            title="مقارنة فورية لمعرفة أثر عكس ترتيب الحسابات"
          >
            <RefreshIcon size={13} />
            مقارنة أثر الترتيب
          </button>

          <button 
            className="btn btn-primary-action"
            onClick={onRun}
            disabled={isRunning}
          >
            <PlayIcon size={12} color="#fff" />
            {isRunning ? 'جاري التشغيل...' : 'تشغيل الاختبار'}
          </button>
        </div>
      </div>
    </div>
  );
};
