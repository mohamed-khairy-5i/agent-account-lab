import React, { useState } from 'react';
import type { SimulationResult } from '../engine.ts';
import { ArrowRightIcon, RefreshIcon, DownloadIcon, LayersIcon, BarChartIcon, TrophyIcon, ShieldIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface BatchOverviewProps {
  onRunBatch: (onProgress: (done: number, total: number) => void) => Promise<SimulationResult[]>;
  onBack: () => void;
}

interface LeaderboardEntry {
  rank: string;
  name: string;
  id: string;
  category: string;
  score: number;
  pass: number;
  safeStop: number;
  fail: number;
  total: number;
  mistargets: number;
  latency: string;
  color: string;
  badge?: string;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: '—',
    name: 'Oracle Reference',
    id: 'oracle-reference',
    category: 'Ground Truth',
    score: 100,
    pass: 7,
    safeStop: 1,
    fail: 0,
    total: 8,
    mistargets: 0,
    latency: '<10ms',
    color: '#10b981'
  },
  {
    rank: '1',
    name: 'GLM-5.3 Flash',
    id: 'free/glm-5.3-flash',
    category: 'Frontier LLM',
    score: 88,
    pass: 7,
    safeStop: 0,
    fail: 1,
    total: 8,
    mistargets: 0,
    latency: '13.1s',
    color: '#34d399',
    badge: '🥇'
  },
  {
    rank: '2',
    name: 'DeepSeek V4.1 Flash',
    id: 'free/deepseek-v4.1-flash',
    category: 'Frontier LLM',
    score: 67,
    pass: 4,
    safeStop: 0,
    fail: 2,
    total: 6,
    mistargets: 2,
    latency: '8.2s',
    color: '#38bdf8',
    badge: '🥈'
  },
  {
    rank: '3',
    name: 'Qwen 3.8 MAX',
    id: 'free/qwen-3.8-max',
    category: 'Frontier LLM',
    score: 67,
    pass: 4,
    safeStop: 0,
    fail: 2,
    total: 6,
    mistargets: 2,
    latency: '9.0s',
    color: '#a78bfa',
    badge: '🥉'
  },
  {
    rank: '4',
    name: 'Kimi K3',
    id: 'free/kimi-k3',
    category: 'Frontier LLM',
    score: 63,
    pass: 5,
    safeStop: 0,
    fail: 3,
    total: 8,
    mistargets: 2,
    latency: '15.8s',
    color: '#818cf8'
  },
  {
    rank: '5',
    name: 'Gemini 3.8 Flash',
    id: 'free/gemini-3.8-flash',
    category: 'Frontier LLM',
    score: 25,
    pass: 2,
    safeStop: 0,
    fail: 6,
    total: 8,
    mistargets: 2,
    latency: '5.2s',
    color: '#fbbf24'
  },
  {
    rank: '—',
    name: 'First Account Heuristic',
    id: 'first_account',
    category: 'Negative Control',
    score: 34,
    pass: 34,
    safeStop: 0,
    fail: 66,
    total: 100,
    mistargets: 47,
    latency: '<10ms',
    color: '#f43f5e'
  },
  {
    rank: '—',
    name: 'Default Account Heuristic',
    id: 'default_account',
    category: 'Negative Control',
    score: 31,
    pass: 31,
    safeStop: 0,
    fail: 69,
    total: 100,
    mistargets: 50,
    latency: '<10ms',
    color: '#be123c'
  }
];

export const BatchOverview: React.FC<BatchOverviewProps> = ({ onRunBatch, onBack }) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'simulation'>('leaderboard');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchData, setBatchData] = useState<{
    totalCases: number;
    totalRuns: number;
    agents: {
      name: string;
      labelAr: string;
      labelEn: string;
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
        labelAr: 'المرجع الاختباري (Oracle Reference)',
        labelEn: 'Oracle Reference (Ground Truth)',
        pass: 95,
        safe_stop: 5,
        fail: 0,
        wrong_effects: 0
      },
      {
        name: 'first_account',
        labelAr: 'ضابط سلبي: أول حساب (First Account)',
        labelEn: 'Negative Control: First Account',
        pass: 34,
        safe_stop: 0,
        fail: 66,
        wrong_effects: 47
      },
      {
        name: 'default_account',
        labelAr: 'ضابط سلبي: الحساب الافتراضي (Default Account)',
        labelEn: 'Negative Control: Default Account',
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
          labelAr: name === 'oracle-reference' 
            ? 'المرجع الاختباري (Oracle Reference)' 
            : (name === 'first_account' ? 'ضابط أول حساب (First Account)' : 'ضابط الحساب الافتراضي (Default Account)'),
          labelEn: name === 'oracle-reference'
            ? 'Oracle Reference (Ground Truth)'
            : (name === 'first_account' ? 'Negative Control: First Account' : 'Negative Control: Default Account'),
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
    <div className="content-area" style={{ maxWidth: '1060px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header Card */}
      <div className="ui-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BarChartIcon size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {t.leaderboard_title}
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t.leaderboard_sub}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary-action" onClick={onBack} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <ArrowRightIcon size={14} />
              {t.back_to_scenarios}
            </button>
            <a 
              href="/benchmark-chart.svg" 
              download="agent-account-lab-benchmark.svg"
              className="btn btn-secondary-action"
              style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.8rem' }}
            >
              <DownloadIcon size={14} />
              {t.chart_download_btn}
            </a>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary-action' : 'btn-secondary-action'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', gap: '6px' }}
          >
            <TrophyIcon size={15} />
            {t.batch_tab_leaderboard}
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`btn ${activeTab === 'simulation' ? 'btn-primary-action' : 'btn-secondary-action'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', gap: '6px' }}
          >
            <LayersIcon size={15} />
            {t.batch_tab_simulation}
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4 Metric Highlight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.metric_best_performer}</span>
                <span style={{ fontSize: '1.1rem' }}>🥇</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>GLM-5.3 Flash</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                88% {lang === 'ar' ? 'نسبة الدقة (7 من 8)' : 'Compliance Score (7/8)'}
              </div>
            </div>

            <div style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.metric_zero_mistargets}</span>
                <ShieldIcon size={16} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>0 Writes</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                GLM-5.3 Flash ({lang === 'ar' ? 'الوحيد بصفر أثر خاطئ' : 'Only model with 0 mistargeted writes'})
              </div>
            </div>

            <div style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.metric_avg_latency}</span>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>5.2s / run</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Gemini 3.8 Flash ({lang === 'ar' ? 'الأسرع زمناً' : 'Fastest inference'})
              </div>
            </div>

            <div style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.metric_total_models}</span>
                <LayersIcon size={16} color="#818cf8" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8' }}>8 Agents</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                5 Frontier LLMs + 3 {lang === 'ar' ? 'ضوابط مرجعية' : 'Baselines'}
              </div>
            </div>
          </div>

          {/* SVG Visual Chart Card */}
          <div className="ui-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChartIcon size={16} color="#818cf8" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{t.chart_preview_title}</h3>
              </div>
              <span className="pill pill-neutral" style={{ fontSize: '0.72rem' }}>
                temperature: 0 • standard suite
              </span>
            </div>
            
            <div style={{ 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: '1px solid var(--border-subtle)',
              background: '#09090b',
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
            }}>
              <img 
                src="/benchmark-chart.svg" 
                alt="Frontier LLM Disambiguation Benchmark Chart" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="ui-card">
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '14px' }}>
              {lang === 'ar' ? 'جدول التفاصيل والنتائج المباشرة' : 'Detailed Empirical Evaluation Breakdown'}
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="diff-table" style={{ width: '100%', textAlign: 'start' }}>
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>{t.col_rank}</th>
                    <th>{t.col_model}</th>
                    <th>{t.col_category}</th>
                    <th style={{ minWidth: '150px' }}>{t.col_score}</th>
                    <th style={{ textAlign: 'center' }}>{t.col_pass}</th>
                    <th style={{ textAlign: 'center' }}>{t.col_safestop}</th>
                    <th style={{ textAlign: 'center' }}>{t.col_fail}</th>
                    <th style={{ textAlign: 'center' }}>{t.col_mistargets}</th>
                    <th style={{ textAlign: 'end' }}>{t.col_latency}</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD_DATA.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>
                        {entry.badge ? <span style={{ fontSize: '1.05rem' }}>{entry.badge}</span> : <span className="font-mono" style={{ color: 'var(--text-dim)' }}>{entry.rank}</span>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{entry.name}</div>
                        <div className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{entry.id}</div>
                      </td>
                      <td>
                        <span className={`pill ${entry.category === 'Frontier LLM' ? 'pill-neutral' : (entry.category === 'Ground Truth' ? 'pill-success' : 'pill-danger')}`} style={{ fontSize: '0.68rem' }}>
                          {entry.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="font-mono" style={{ fontWeight: 800, width: '38px', color: entry.score >= 70 ? '#34d399' : (entry.score >= 50 ? '#818cf8' : '#f43f5e') }}>
                            {entry.score}%
                          </span>
                          <div style={{ flex: 1, height: '6px', background: '#1c1c24', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${entry.score}%`, 
                                background: entry.color,
                                borderRadius: '4px'
                              }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#10b981' }} className="font-mono">
                        {entry.pass}
                      </td>
                      <td style={{ textAlign: 'center', color: '#f59e0b' }} className="font-mono">
                        {entry.safeStop}
                      </td>
                      <td style={{ textAlign: 'center', color: entry.fail > 0 ? '#f43f5e' : 'var(--text-dim)' }} className="font-mono">
                        {entry.fail}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`pill ${entry.mistargets === 0 ? 'pill-success' : 'pill-danger'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          {entry.mistargets}
                        </span>
                      </td>
                      <td style={{ textAlign: 'end', color: 'var(--text-muted)' }} className="font-mono">
                        {entry.latency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {lang === 'ar'
                ? '* تم إجراء الاختبارات على نقاط نهاية متوافقة مع بروتوكول OpenAI في ظروف اختبار قياسية موحدة (Temperature = 0) ومقارنتها بسجلات الأثر على نظام الملفات.'
                : '* Evaluations conducted on standard OpenAI-compatible endpoints with deterministic decoding (Temperature = 0) with automated ground truth diff validation.'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulation' && (
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <LayersIcon size={18} color="#818cf8" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {lang === 'ar' ? 'المحاكاة الشاملة (100 حالة × 3 وكلاء)' : 'Deterministic Simulation (100 Cases × 3 Agents)'}
                </h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'ar' 
                  ? 'فحص اتساق المختبر عبر كافة العائلات العشرين وتفرعاتها الخمس (300 تشغيل في الذاكرة دون استهلاك API).'
                  : 'Deterministic consistency evaluation across all 20 base families and 5 permutations (300 in-memory runs).'}
              </p>
            </div>

            <button 
              className="btn btn-primary-action" 
              onClick={handleStartBatch}
              disabled={isRunning}
            >
              <RefreshIcon size={13} />
              {isRunning ? (lang === 'ar' ? 'جاري التشغيل...' : 'Running...') : (lang === 'ar' ? 'إعادة تشغيل المحاكاة' : 'Re-run Benchmark')}
            </button>
          </div>

          {progress && (
            <div style={{ margin: '16px 0', padding: '12px 14px', background: '#121215', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                <span>{lang === 'ar' ? 'تقدم المحاكاة:' : 'Simulation Progress:'}</span>
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
              const total = ag.pass + ag.fail + ag.safe_stop;
              const passPct = total > 0 ? Math.round(((ag.pass + ag.safe_stop) / total) * 100) : 0;
              const label = lang === 'ar' ? ag.labelAr : ag.labelEn;

              return (
                <div key={ag.name} style={{ background: '#121215', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{label}</div>
                  <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '12px' }}>{ag.name}</div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.7rem', fontWeight: 800, color: passPct > 80 ? '#10b981' : '#f43f5e' }}>
                      {passPct}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {lang === 'ar' ? 'نسبة المطابقة' : 'Compliance Rate'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#10b981' }}>{lang === 'ar' ? 'نجاح (PASS):' : 'Pass (PASS):'}</span>
                      <strong className="font-mono">{ag.pass}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f59e0b' }}>{lang === 'ar' ? 'توقف آمن (SAFE_STOP):' : 'Safe Stop (SAFE_STOP):'}</span>
                      <strong className="font-mono">{ag.safe_stop}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f43f5e' }}>{lang === 'ar' ? 'فشل (FAIL):' : 'Fail (FAIL):'}</span>
                      <strong className="font-mono">{ag.fail}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      <span style={{ color: '#fda4af' }}>{lang === 'ar' ? 'أثر خاطئ منفّذ:' : 'Mistargeted Writes:'}</span>
                      <strong className="font-mono" style={{ color: '#f43f5e' }}>{ag.wrong_effects}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {lang === 'ar' 
                ? '* بيانات محاكاة حتمية لفحص اتساق المختبر؛ لا تمثل نتائج نماذج ذكاء اصطناعي.'
                : '* In-memory deterministic controls verifying harness integrity; not real AI benchmark scores.'}
            </div>

            <button className="btn btn-secondary-action" onClick={downloadJson}>
              <DownloadIcon size={13} />
              {lang === 'ar' ? 'تصدير تقرير JSON' : 'Export JSON Summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
