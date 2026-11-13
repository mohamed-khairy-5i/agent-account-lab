import benchmarkReportRaw from '../../reports/multi-model-benchmark.json';

export interface LeaderboardEntry {
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
  rateLimited?: number;
}

export const BENCHMARK_TIMESTAMP = benchmarkReportRaw.timestamp;

export function getLeaderboardData(): LeaderboardEntry[] {
  // Oracle reference ground truth (programmatic baseline across the 8 standard cases)
  const oracle: LeaderboardEntry = {
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
  };

  const MODEL_COLORS: Record<string, string> = {
    'free/glm-5.3-flash': '#34d399',
    'free/deepseek-v4.1-flash': '#38bdf8',
    'free/qwen-3.8-max': '#a78bfa',
    'free/kimi-k3': '#818cf8',
    'free/gemini-3.8-flash': '#fbbf24'
  };

  const RANK_BADGES = ['🥇', '🥈', '🥉'];

  const models: LeaderboardEntry[] = (benchmarkReportRaw.leaderboard as any[]).map((m, idx) => {
    const rateLimited = m.results?.filter((r: any) => r.verdict === 'RATE_LIMITED').length || m.rate_limited || 0;
    const evaluatedCases = m.pass + m.safe_stop + m.fail;
    return {
      rank: String(idx + 1),
      name: m.label,
      id: m.model_id,
      category: 'Frontier LLM',
      score: m.score_pct,
      pass: m.pass,
      safeStop: m.safe_stop,
      fail: m.fail,
      total: evaluatedCases || 8,
      mistargets: m.mistargeted_writes ?? 0,
      latency: `${m.avg_latency_s}s`,
      color: MODEL_COLORS[m.model_id] || '#818cf8',
      badge: RANK_BADGES[idx],
      rateLimited
    };
  });

  const baselines: LeaderboardEntry[] = [
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
      color: '#fb7185'
    }
  ];

  return [oracle, ...models, ...baselines];
}

export interface BenchmarkSummary {
  timestamp: string;
  topModel: {
    label: string;
    scorePct: number;
    pass: number;
    evaluatedCases: number;
  } | null;
  zeroMistargetModel: {
    label: string;
    mistargets: number;
  } | null;
  fastestModel: {
    label: string;
    avgLatency: string;
  } | null;
  totalAgentsCount: number;
  totalLlmCount: number;
  totalBaselineCount: number;
}

export function getBenchmarkSummary(customEntries?: LeaderboardEntry[]): BenchmarkSummary {
  const allEntries = customEntries || getLeaderboardData();
  const llmEntries = allEntries.filter(m => m.category === 'Frontier LLM');
  
  // Authoritative multi-tier sort:
  // 1. score descending
  // 2. mistargets ascending
  // 3. total (evaluated cases) descending
  // 4. latency ascending
  const sortedLlm = [...llmEntries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.mistargets !== b.mistargets) return a.mistargets - b.mistargets;
    if (b.total !== a.total) return b.total - a.total;
    return parseFloat(a.latency) - parseFloat(b.latency);
  });

  const top = sortedLlm[0] || null;
  const zeroMistarget = llmEntries.find(m => m.mistargets === 0) || null;
  const fastest = [...llmEntries].sort((a, b) => parseFloat(a.latency) - parseFloat(b.latency))[0] || null;

  return {
    timestamp: BENCHMARK_TIMESTAMP,
    topModel: top ? {
      label: top.name,
      scorePct: top.score,
      pass: top.pass,
      evaluatedCases: top.total
    } : null,
    zeroMistargetModel: zeroMistarget ? {
      label: zeroMistarget.name,
      mistargets: zeroMistarget.mistargets
    } : null,
    fastestModel: fastest ? {
      label: fastest.name,
      avgLatency: fastest.latency
    } : null,
    totalAgentsCount: allEntries.length,
    totalLlmCount: llmEntries.length,
    totalBaselineCount: allEntries.length - llmEntries.length
  };
}
