import React from 'react';
import type { SimulationResult } from '../engine.ts';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, TerminalIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface TraceViewerProps {
  result: SimulationResult;
  targetAccountId: string;
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ result, targetAccountId }) => {
  const { lang, t, getReasonText } = useLanguage();
  const isPass = result.verdict === 'PASS';
  const isSafeStop = result.verdict === 'SAFE_STOP';
  const isFail = result.verdict === 'FAIL';

  return (
    <div className="ui-card">
      <div className={`verdict-box ${result.verdict}`}>
        <div className="verdict-left">
          {isPass && <CheckCircleIcon size={22} />}
          {isFail && <XCircleIcon size={22} />}
          {isSafeStop && <AlertTriangleIcon size={22} />}

          <div>
            <div className="verdict-title-text">
              {isPass && t.verdict_pass}
              {isFail && t.verdict_fail}
              {isSafeStop && t.verdict_safestop}
            </div>
            <div className="verdict-subtext">
              {isPass && t.verdict_pass_sub}
              {isFail && t.verdict_fail_sub}
              {isSafeStop && t.verdict_safestop_sub}
            </div>
          </div>
        </div>

        <div style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontSize: '0.8rem' }}>
          <div>
            <span>{t.tool_calls_count} </span>
            <span className="font-mono" style={{ fontWeight: 700, color: '#e0e7ff' }}>{result.metrics.tool_calls}</span>
          </div>
          {result.metrics.mistargeted_write_effects > 0 && (
            <div style={{ color: '#f43f5e', fontWeight: 700, marginTop: '2px' }}>
              <span>{t.wrong_writes_count} </span>
              <span className="font-mono">{result.metrics.mistargeted_write_effects}</span>
            </div>
          )}
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f43f5e', marginBottom: '8px' }}>
            {t.eval_reasons_title}
          </div>
          <div className="reasons-tags-row">
            {result.reasons.map((r, i) => (
              <span key={i} className="pill pill-rose" style={{ padding: '4px 9px' }}>
                {getReasonText(r)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <TerminalIcon size={16} color="#818cf8" />
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t.trace_title}</h3>
      </div>

      <div className="timeline-list">
        {result.trace.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '16px', fontSize: '0.85rem' }}>
            {lang === 'ar' ? 'لم يقم الوكيل باستدعاء أي أداة.' : 'No tool calls were executed by the agent.'}
          </div>
        ) : (
          result.trace.map((event: any, idx: number) => {
            const isMutation = ['rename_file', 'move_file'].includes(event.tool);
            const callAccountId = event.args?.account_id;
            const isWrongAccount = isMutation && callAccountId && callAccountId !== targetAccountId;

            return (
              <div 
                key={idx} 
                className={`timeline-row ${isWrongAccount ? 'faulty-mutation' : ''} ${isMutation && !isWrongAccount ? 'correct-mutation' : ''}`}
              >
                <div className="timeline-top">
                  <div className="tool-badge-area">
                    <span className="step-number">#{event.step}</span>
                    <span className="tool-name-code font-mono">{event.tool}</span>

                    {isWrongAccount && (
                      <span className="pill pill-rose">
                        {lang === 'ar' ? `تعديل في الحساب الخاطئ (${callAccountId})` : `Wrong Account Mutation (${callAccountId})`}
                      </span>
                    )}

                    {isMutation && !isWrongAccount && (
                      <span className="pill pill-emerald">
                        {lang === 'ar' ? 'في الحساب المستهدف' : 'Target Account'}
                      </span>
                    )}

                    {event.tool === 'ask_user' && (
                      <span className="pill pill-amber">
                        {lang === 'ar' ? 'استيضاح من المستخدم' : 'Clarification Request'}
                      </span>
                    )}
                  </div>

                  <span className={`pill ${event.result?.ok ? 'pill-emerald' : 'pill-rose'} font-mono`}>
                    {event.result?.ok ? '200 OK' : (lang === 'ar' ? 'رفض البوابة' : 'Rejected')}
                  </span>
                </div>

                <div className="timeline-grid">
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>{t.args_label}</div>
                    <pre className="code-terminal">{JSON.stringify(event.args, null, 2)}</pre>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>{t.response_label}</div>
                    <pre className="code-terminal">{JSON.stringify(event.result?.data || event.result?.error, null, 2)}</pre>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
