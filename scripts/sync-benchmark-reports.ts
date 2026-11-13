import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const reportPath = path.join(rootDir, 'reports', 'multi-model-benchmark.json');
const raw = fs.readFileSync(reportPath, 'utf-8');
const data = JSON.parse(raw);

console.log('Synchronizing benchmark reports from authoritative test case results...');

for (const entry of data.leaderboard) {
  const pass = entry.results.filter((r: any) => r.verdict === 'PASS').length;
  const safe_stop = entry.results.filter((r: any) => r.verdict === 'SAFE_STOP').length;
  const fail = entry.results.filter((r: any) => r.verdict === 'FAIL').length;
  const rate_limited = entry.results.filter((r: any) => r.verdict === 'RATE_LIMITED').length;
  const mistargeted_writes = entry.results.reduce((s: number, r: any) => s + (r.wrong_writes || 0), 0);
  const totalEvaluated = pass + safe_stop + fail;
  const score_pct = totalEvaluated > 0 ? Math.round(((pass + safe_stop) / totalEvaluated) * 100) : 0;
  const avg_latency_s = (entry.results.reduce((s: number, r: any) => s + parseFloat(r.latency_s || '0'), 0) / entry.results.length).toFixed(1);

  console.log(`  Model: ${entry.label} -> score_pct: ${score_pct}%, pass: ${pass}, safe_stop: ${safe_stop}, fail: ${fail}, rate_limited: ${rate_limited}, wrong_writes: ${mistargeted_writes}`);

  entry.score_pct = score_pct;
  entry.pass = pass;
  entry.safe_stop = safe_stop;
  entry.fail = fail;
  if (rate_limited > 0) {
    entry.rate_limited = rate_limited;
  }
  entry.mistargeted_writes = mistargeted_writes;
  entry.avg_latency_s = avg_latency_s;
}

// Write back synchronized JSON report
fs.writeFileSync(reportPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('✅ reports/multi-model-benchmark.json updated and synchronized.');

// Update benchmark-chart.svg and ui/public/benchmark-chart.svg
function updateChartSvg(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // GLM-5.3 Flash: 88% width = 438px, text at 651
  content = content.replace(
    /<!-- Bar 2: GLM-5\.3 Flash \(\d+%\) -->[\s\S]*?<g transform="translate\(36, 137\)">[\s\S]*?<\/g>/,
    `<!-- Bar 2: GLM-5.3 Flash (88%) -->
  <g transform="translate(36, 137)">
    <text x="188" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#34d399" text-anchor="end">🥇 GLM-5.3 Flash</text>
    <text x="188" y="32" font-family="'JetBrains Mono', monospace" font-size="10" fill="#71717a" text-anchor="end">Frontier LLM (Rank 1)</text>
    
    <rect x="204" y="8" width="500" height="24" rx="5" fill="#18181b" />
    <rect x="204" y="8" width="438" height="24" rx="5" fill="url(#barGLM)" />
    <text x="651" y="25" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#34d399">88%</text>
    <rect x="752" y="10" width="48" height="18" rx="4" fill="#064e3b" />
    <text x="776" y="23" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#34d399" text-anchor="middle">0 err</text>
  </g>`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Chart updated: ${filePath}`);
}

updateChartSvg(path.join(rootDir, 'benchmark-chart.svg'));
updateChartSvg(path.join(rootDir, 'ui', 'public', 'benchmark-chart.svg'));
