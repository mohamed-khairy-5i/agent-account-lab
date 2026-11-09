import React, { useState } from 'react';
import type { SimulationResult } from '../engine.ts';
import { ArrowRightIcon, RefreshIcon, DownloadIcon, LayersIcon } from './Icons.tsx';

interface BatchOverviewProps {
  onRunBatch: (onProgress: (done: number, total: number) => void) => Promise<SimulationResult[]>;
  onBack: () => void;
}

export const BatchOverview: React.FC<BatchOverviewProps> = ({ onRunBatch, onBack }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchData, setBatchData] = useState<{
    totalCases: number;
    totalRuns: number;
    agents: {
      name: string;
      label: string;
      pass: number;
      safe_stop: number;
      fail: number;
      wrong_effects: number;
    }[];
  } | null>({
    totalCases: 100,
    totalRuns: 300,
    agents: [
      {
        name: 'oracle-reference',
        label: 'المرجع الاختباري (Oracle Reference)',
        pass: 95,
        safe_stop: 5,
        fail: 0,
        wrong_effects: 0
      },
      {
        name: 'first_account',
        label: 'ضابط سلبي: أول حساب (First Account)',
        pass: 34,
        safe_stop: 0,
        fail: 66,
        wrong_effects: 47
      },
      {
        name: 'default_account',
        label: 'ضابط سلبي: الحساب الافتراضي (Default Account)',
        pass: 31,
        safe_stop: 0,
        fail: 69,
        wrong_effects: 50
      }
    ]
  });

  const handleStartBatch = async () => {
    setIsRunning(true);
    setProgress({ done: 0, total: 300 });

    try {
      const results = await onRunBatch((done, total) => {
        setProgress({ done, total });
      });

      const agentNames = ['oracle-reference', 'first_account', 'default_account'];
      const agentStats = agentNames.map(name => {
        const rows = results.filter(r => r.agent_name === name);
        return {
          name,
          label: name === 'oracle-reference' 
            ? 'المرجع الاختباري (Oracle Reference)' 
            : (name === 'first_account' ? 'ضابط أول حساب (First Account)' : 'ضابط الحساب الافتراضي (Default Account)'),
          pass: rows.filter(r => r.verdict === 'PASS').length,
          safe_stop: rows.filter(r => r.verdict === 'SAFE_STOP').length,
          fail: rows.filter(r => r.verdict === 'FAIL').length,
          wrong_effects: rows.reduce((acc, r) => acc + r.metrics.mistargeted_write_effects, 0)
        };
      });

      setBatchData({
        totalCases: 100,
        totalRuns: results.length,
        agents: agentStats
      });
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(batchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-account-lab-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content-area" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <LayersIcon size={18} color="#818cf8" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>المحاكاة الشاملة (100 حالة × 3 وكلاء)</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              فحص اتساق المختبر عبر كافة العائلات العشرين وتفرعاتها الخمس (300 تشغيل في الذاكرة).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary-action" onClick={onBack}>
              <ArrowRightIcon size={13} />
              العودة
            </button>
            <button 
              className="btn btn-primary-action" 
              onClick={handleStartBatch}
              disabled={isRunning}
            >
              <RefreshIcon size={13} />
              {isRunning ? 'جاري التشغيل...' : 'إعادة تشغيل المحاكاة'}
            </button>
          </div>
        </div>

        {progress && (
          <div style={{ margin: '16px 0', padding: '12px 14px', background: '#121215', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span>تقدم المحاكاة:</span>
              <span className="font-mono">{progress.done} / {progress.total}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(progress.done / progress.total) * 100}%`, 
                  background: 'linear-gradient(90deg, #6366f1, #10b981)',
                  transition: 'width 0.1s ease'
                }} 
              />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '16px' }}>
          {batchData?.agents.map(ag => {
            const passPct = Math.round((ag.pass / (ag.pass + ag.fail + ag.safe_stop)) * 100);

            return (
              <div key={ag.name} style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{ag.label}</div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '12px' }}>{ag.name}</div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.7rem', fontWeight: 800, color: passPct > 80 ? '#10b981' : '#f43f5e' }}>
                    {passPct}%
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>نسبة المطابقة</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#10b981' }}>نجاح (PASS):</span>
                    <strong className="font-mono">{ag.pass}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f59e0b' }}>توقف آمن (SAFE_STOP):</span>
                    <strong className="font-mono">{ag.safe_stop}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f43f5e' }}>فشل (FAIL):</span>
                    <strong className="font-mono">{ag.fail}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                    <span style={{ color: '#fda4af' }}>أثر خاطئ منفّذ:</span>
                    <strong className="font-mono" style={{ color: '#f43f5e' }}>{ag.wrong_effects}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            * بيانات محاكاة حتمية لفحص اتساق المختبر؛ لا تمثل نتائج نماذج ذكاء اصطناعي.
          </div>

          <button className="btn btn-secondary-action" onClick={downloadJson}>
            <DownloadIcon size={13} />
            تصدير تقرير JSON
          </button>
        </div>
      </div>
    </div>
  );
};
