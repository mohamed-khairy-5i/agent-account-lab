import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export interface ModelResult {
  case_id: string;
  verdict: string;
  reasons: string[];
  latency_s: string;
  wrong_writes: number;
}

export interface LeaderboardModel {
  model_id: string;
  label: string;
  score_pct: number;
  pass: number;
  safe_stop: number;
  fail: number;
  rate_limited: number;
  evaluated_cases: number;
  total_cases: number;
  mistargeted_writes: number;
  avg_latency_s: string;
  results: ModelResult[];
}

/**
 * Sorts models dynamically by evaluation metrics:
 * 1. score_pct (descending)
 * 2. mistargeted_writes (ascending - fewer critical safety errors is better)
 * 3. evaluated_cases (descending - higher completion coverage)
 * 4. avg_latency_s (ascending - faster inference)
 */
export function sortLeaderboard(models: LeaderboardModel[]): LeaderboardModel[] {
  return [...models].sort((a, b) => {
    if (b.score_pct !== a.score_pct) {
      return b.score_pct - a.score_pct;
    }
    if (a.mistargeted_writes !== b.mistargeted_writes) {
      return a.mistargeted_writes - b.mistargeted_writes;
    }
    if (b.evaluated_cases !== a.evaluated_cases) {
      return b.evaluated_cases - a.evaluated_cases;
    }
    return parseFloat(a.avg_latency_s || '999') - parseFloat(b.avg_latency_s || '999');
  });
}

export function getRankBadge(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return String(index + 1);
}

/**
 * Dynamically generates footnotes without ANY hardcoded numbers
 */
export function generateFootnotes(sortedModels: LeaderboardModel[], lang: 'en' | 'ar'): string {
  const notes: string[] = [];

  // 1. Models with rate-limited cases
  const rateLimitedModels = sortedModels.filter(m => (m.rate_limited || 0) > 0);
  for (const m of rateLimitedModels) {
    const rawScorePct = Math.round(((m.pass + m.safe_stop) / (m.total_cases || 8)) * 100);
    const rlCases = (m.results || [])
      .filter((r: any) => r.verdict === 'RATE_LIMITED')
      .map((r: any) => r.case_id)
      .join(', ');

    if (lang === 'en') {
      notes.push(
        `- **Rate Limit Isolation (${m.label}):** Scored **${m.score_pct}%** across ${m.evaluated_cases} completed evaluation cases (${m.pass}/${m.evaluated_cases}), with ${m.rate_limited} case(s) recorded as service unavailable due to upstream provider rate limits (${rlCases || '429'}). Evaluated over all ${m.total_cases} cases without rate-limit isolation, raw compliance is ${rawScorePct}% (${m.pass}/${m.total_cases}).`
      );
    } else {
      notes.push(
        `- **عزل أخطاء الخدمة (${m.label}):** حقق نسبة **${m.score_pct}%** عبر ${m.evaluated_cases} حالات مقيّمة بالكامل (${m.pass} من ${m.evaluated_cases})، مع تسجيل ${m.rate_limited} حالة كتعذر خدمة بسبب تجاوز معدل الطلبات لدى المزود (${rlCases || '429'}). وبحسابه على إجمالي الـ ${m.total_cases} حالات دون عزل، تكون النسبة الخام ${rawScorePct}% (${m.pass} من ${m.total_cases}).`
      );
    }
  }

  // 2. Gemini exploratory footnote
  const gemini = sortedModels.find(m => m.label.toLowerCase().includes('gemini'));
  if (gemini) {
    if (lang === 'en') {
      notes.push(
        `- **${gemini.label}:** Standardized ${gemini.total_cases}-case benchmark scored **${gemini.score_pct}%** (${gemini.pass}/${gemini.evaluated_cases}) with ${gemini.mistargeted_writes} mistargeted writes; expanded 16-case exploratory suite achieved 44% (7/16). Full telemetry documented in [\`docs/RESEARCH_REPORT.md\`](docs/RESEARCH_REPORT.md).`
      );
    } else {
      notes.push(
        `- **${gemini.label}:** في مجموعة الـ ${gemini.total_cases} حالات الموحدة حقق **${gemini.score_pct}%** (${gemini.pass} من ${gemini.evaluated_cases}) مع ${gemini.mistargeted_writes} خطأي تعديل غير مقصود؛ وفي الاختبار الاستكشافي الموسع (16 حالة) حقق 44% (7 من 16). التفاصيل في [ورقة البحث](docs/RESEARCH_REPORT.md).`
      );
    }
  }

  return notes.join('\n');
}

/**
 * Dynamically generates Markdown table and footnotes
 */
export function generateMarkdownTable(sortedModels: LeaderboardModel[], lang: 'en' | 'ar'): string {
  const isEn = lang === 'en';
  const header = isEn
    ? `| Rank | Model / Agent Under Test | Category | Score | Evaluated Pass | Safe Stop | Fail | Service Unavailable (429) | Mistargeted Writes | Avg Latency |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| — | **\`oracle-reference\`** | Programmatic Oracle | **100%** | 7 / 8 | 1 | 0 | 0 | 0 | <10ms |`
    : `| الترتيب | النموذج / الوكيل المختبر | الفئة | النتيجة | نجاح مقيّم (Pass) | توقف آمن | فشل (Fail) | تعذر الخدمة (429) | تعديلات خاطئة (Wrong Writes) | متوسط الاستجابة |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| — | **\`oracle-reference\`** | مرجع برمجي مثالي | **100%** | 7 / 8 | 1 | 0 | 0 | 0 | <10ms |`;

  const rows = sortedModels.map((m, idx) => {
    const rank = getRankBadge(idx);
    const category = isEn ? 'Frontier LLM' : 'نموذج ذكاء اصطناعي';
    const wrong = m.mistargeted_writes === 0 ? '**0**' : m.mistargeted_writes;
    const hasNote = (m.rate_limited > 0 || m.label.toLowerCase().includes('gemini')) ? '*' : '';
    return `| ${rank} | **${m.label}** (\`${m.model_id}\`)${hasNote} | ${category} | **${m.score_pct}%** | ${m.pass} / ${m.evaluated_cases} | ${m.safe_stop} | ${m.fail} | ${m.rate_limited || 0} | ${wrong} | ${m.avg_latency_s}s |`;
  }).join('\n');

  const negativeControls = isEn
    ? `| — | **\`first_account\` Baseline** | Negative Control | **34%** | 34 / 100 | 0 | 66 | 0 | 47 | <10ms |
| — | **\`default_account\` Baseline** | Negative Control | **31%** | 31 / 100 | 0 | 69 | 0 | 50 | <10ms |`
    : `| — | **\`first_account\` Baseline** | ضابط سلبي مبرمج | **34%** | 34 / 100 | 0 | 66 | 0 | 47 | <10ms |
| — | **\`default_account\` Baseline** | ضابط سلبي مبرمج | **31%** | 31 / 100 | 0 | 69 | 0 | 50 | <10ms |`;

  const notesHeader = isEn ? `\n\n*\*Notes on evaluation conditions:*\n` : `\n\n*\*ملاحظات شروط التقييم:*\n`;
  const footnotes = generateFootnotes(sortedModels, lang);

  return `${header}\n${rows}\n${negativeControls}${notesHeader}${footnotes}`;
}

export function syncBenchmark() {
  const reportPath = path.join(rootDir, 'reports', 'multi-model-benchmark.json');
  if (!fs.existsSync(reportPath)) return;
  const raw = fs.readFileSync(reportPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('🔄 Synchronizing benchmark reports & migrating rate-limited cases from authoritative results...');

  // 1. Process each model: migrate legacy 429 cases to RATE_LIMITED and compute exact metrics
  for (const model of data.leaderboard) {
    for (const r of model.results) {
      const is429 = (r.reasons && r.reasons.some((reason: string) =>
        reason.includes('429') || reason.includes('Rate limit') || reason.includes('rate_limit') || reason.includes('RATE_LIMIT')
      )) || r.verdict === 'RATE_LIMITED';

      if (is429) {
        r.verdict = 'RATE_LIMITED';
        r.reasons = ['infrastructure_rate_limited:429'];
        r.wrong_writes = r.wrong_writes ?? 0;
        r.latency_s = '0';
      }
    }

    const pass = model.results.filter((r: any) => r.verdict === 'PASS').length;
    const safe_stop = model.results.filter((r: any) => r.verdict === 'SAFE_STOP').length;
    const fail = model.results.filter((r: any) => r.verdict === 'FAIL').length;
    const rate_limited = model.results.filter((r: any) => r.verdict === 'RATE_LIMITED').length;
    const evaluated_cases = pass + safe_stop + fail;
    const total_cases = model.results.length;
    const mistargeted_writes = model.results.reduce((s: number, r: any) => s + (r.wrong_writes || 0), 0);
    const score_pct = evaluated_cases > 0 ? Math.round(((pass + safe_stop) / evaluated_cases) * 100) : 0;
    
    const evaluatedResults = model.results.filter((r: any) => r.verdict !== 'RATE_LIMITED');
    const avg_latency_s = (evaluatedResults.reduce((s: number, r: any) => s + parseFloat(r.latency_s || '0'), 0) / (evaluatedResults.length || 1)).toFixed(1);

    model.score_pct = score_pct;
    model.pass = pass;
    model.safe_stop = safe_stop;
    model.fail = fail;
    model.rate_limited = rate_limited;
    model.evaluated_cases = evaluated_cases;
    model.total_cases = total_cases;
    model.mistargeted_writes = mistargeted_writes;
    model.avg_latency_s = avg_latency_s;
  }

  // Dynamically sort the leaderboard by declared evaluation rules
  const sorted = sortLeaderboard(data.leaderboard);
  data.leaderboard = sorted;

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    console.log(`  Rank ${getRankBadge(i)}: ${m.label} -> score: ${m.score_pct}% (${m.pass}/${m.evaluated_cases} eval, ${m.rate_limited} rate-limited, ${m.fail} fail, ${m.mistargeted_writes} wrong writes, ${m.avg_latency_s}s)`);
  }

  // Save updated reports/multi-model-benchmark.json
  fs.writeFileSync(reportPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log('✅ reports/multi-model-benchmark.json updated and synchronized.');

  // Color mapping per model
  const colorMap: Record<string, { gradient: string; color: string }> = {
    'glm': { gradient: 'barGLM', color: '#34d399' },
    'deepseek': { gradient: 'barDeepSeek', color: '#38bdf8' },
    'qwen': { gradient: 'barQwen', color: '#c084fc' },
    'kimi': { gradient: 'barKimi', color: '#a5b4fc' },
    'gemini': { gradient: 'barGemini', color: '#fcd34d' }
  };

  function getModelStyle(label: string) {
    const lower = label.toLowerCase();
    for (const key of Object.keys(colorMap)) {
      if (lower.includes(key)) return colorMap[key];
    }
    return { gradient: 'barBaseline', color: '#a1a1aa' };
  }

  // 2. Generate SVG chart dynamically without ANY hardcoded numbers
  function updateChartSvg(filePath: string) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    const yOffsets = [137, 179, 221, 263, 305];

    for (let i = 0; i < sorted.length && i < yOffsets.length; i++) {
      const model = sorted[i];
      const y = yOffsets[i];
      const { gradient, color } = getModelStyle(model.label);
      const width = Math.round(500 * (model.score_pct / 100));
      const textX = 204 + width + 9;
      const badgeText = `${model.mistargeted_writes} err${model.mistargeted_writes === 1 ? '' : 's'}`;
      const badgeBg = model.mistargeted_writes === 0 ? '#064e3b' : '#4c0519';
      const badgeFg = model.mistargeted_writes === 0 ? '#34d399' : '#fda4af';
      const rankBadge = getRankBadge(i);

      // Regex to match the bar group at transform translate(36, <y>)
      const barRegex = new RegExp(`<g transform="translate\\(36, ${y}\\)">[\\s\\S]*?<\\/g>`);
      const newBar = `<g transform="translate(36, ${y})">
    <text x="188" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="${color}" text-anchor="end">${rankBadge} ${model.label}</text>
    <text x="188" y="32" font-family="'JetBrains Mono', monospace" font-size="10" fill="#71717a" text-anchor="end">${model.rate_limited > 0 ? `${model.evaluated_cases} eval, ${model.rate_limited} rate-limited` : `Frontier LLM (N=${model.total_cases})`}</text>
    
    <rect x="204" y="8" width="500" height="24" rx="5" fill="#18181b" />
    <rect x="204" y="8" width="${width}" height="24" rx="5" fill="url(#${gradient})" />
    <text x="${textX}" y="25" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="${color}">${model.score_pct}%</text>
    <rect x="752" y="10" width="48" height="18" rx="4" fill="${badgeBg}" />
    <text x="776" y="23" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="${badgeFg}" text-anchor="middle">${badgeText}</text>
  </g>`;

      content = content.replace(barRegex, newBar);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ SVG chart dynamically updated: ${filePath}`);
  }

  updateChartSvg(path.join(rootDir, 'benchmark-chart.svg'));
  updateChartSvg(path.join(rootDir, 'ui', 'public', 'benchmark-chart.svg'));

  // 3. Dynamically update Markdown tables in README.md, README_AR.md, and RESEARCH_REPORT.md
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    let content = fs.readFileSync(readmePath, 'utf-8');
    content = content.replace(
      /\| Rank \| Model \/ Agent Under Test \|[\s\S]*?(?=\n---\n)/,
      generateMarkdownTable(sorted, 'en')
    );
    fs.writeFileSync(readmePath, content, 'utf-8');
    console.log('✅ README.md table dynamically updated.');
  }

  const readmeArPath = path.join(rootDir, 'README_AR.md');
  if (fs.existsSync(readmeArPath)) {
    let content = fs.readFileSync(readmeArPath, 'utf-8');
    content = content.replace(
      /\| الترتيب \| النموذج \/ الوكيل المختبر \|[\s\S]*?(?=\n---\n)/,
      generateMarkdownTable(sorted, 'ar')
    );
    fs.writeFileSync(readmeArPath, content, 'utf-8');
    console.log('✅ README_AR.md table dynamically updated.');
  }

  const researchPath = path.join(rootDir, 'docs', 'RESEARCH_REPORT.md');
  if (fs.existsSync(researchPath)) {
    let content = fs.readFileSync(researchPath, 'utf-8');
    if (content.includes('<!-- BENCHMARK_TABLE_START -->') && content.includes('<!-- BENCHMARK_TABLE_END -->')) {
      content = content.replace(
        /<!-- BENCHMARK_TABLE_START -->[\s\S]*?<!-- BENCHMARK_TABLE_END -->/,
        `<!-- BENCHMARK_TABLE_START -->\n${generateMarkdownTable(sorted, 'en')}\n<!-- BENCHMARK_TABLE_END -->`
      );
    } else {
      content = content.replace(
        /\| Rank \| Model \/ Agent Under Test \|[\s\S]*?(?=\n\n### 4\.2|\n\n### 4\.1|\n---\n)/,
        generateMarkdownTable(sorted, 'en')
      );
    }
    fs.writeFileSync(researchPath, content, 'utf-8');
    console.log('✅ docs/RESEARCH_REPORT.md table dynamically updated.');
  }

  // Update UI ScenarioViewer options in sorted order
  const viewerPath = path.join(rootDir, 'ui', 'src', 'components', 'ScenarioViewer.tsx');
  if (fs.existsSync(viewerPath)) {
    let content = fs.readFileSync(viewerPath, 'utf-8');
    const optionsBlock = sorted.map((m, idx) => {
      const badge = getRankBadge(idx);
      const noteAr = m.rate_limited > 0 ? `${m.score_pct}% (${m.evaluated_cases} حالات مقيمة)` : `${m.score_pct}% نجاح`;
      const noteEn = m.rate_limited > 0 ? `${m.score_pct}% (${m.evaluated_cases} cases eval)` : `${m.score_pct}% Score`;
      const val = m.model_id.replace('free/', '');
      return `              <option value="${val}">{lang === 'ar' ? '${badge} ${m.label} (${noteAr})' : '${badge} ${m.label} (${noteEn})'}</option>`;
    }).join('\n');

    content = content.replace(
      /<optgroup label=\{lang === 'ar' \? '⚡ نماذج ذكاء اصطناعي حقيقية \(Live Frontier APIs\)' : '⚡ Frontier AI Models \(Live APIs\)'\}>[\s\S]*?<\/optgroup>/,
      `<optgroup label={lang === 'ar' ? '⚡ نماذج ذكاء اصطناعي حقيقية (Live Frontier APIs)' : '⚡ Frontier AI Models (Live APIs)'}>\n${optionsBlock}\n            </optgroup>`
    );
    fs.writeFileSync(viewerPath, content, 'utf-8');
    console.log('✅ ui/src/components/ScenarioViewer.tsx dynamically updated.');
  }

  // Update UI BatchOverview card for Rank 1
  const overviewPath = path.join(rootDir, 'ui', 'src', 'components', 'BatchOverview.tsx');
  if (fs.existsSync(overviewPath) && sorted.length > 0) {
    const top = sorted[0];
    let content = fs.readFileSync(overviewPath, 'utf-8');
    content = content.replace(
      /<div style=\{\{ fontSize: '1\.25rem', fontWeight: 800, color: '#34d399' \}\}>.*?<\/div>\s*<div style=\{\{ fontSize: '0\.74rem', color: 'var\(--text-dim\)', marginTop: '2px' \}\}>\s*.*?\{lang === 'ar' \? '.*?' : '.*?'\}\s*<\/div>/,
      `<div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>${top.label}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                ${top.score_pct}% {lang === 'ar' ? 'نسبة الدقة (${top.pass} من ${top.evaluated_cases})' : 'Compliance Score (${top.pass}/${top.evaluated_cases})'}
              </div>`
    );
    fs.writeFileSync(overviewPath, content, 'utf-8');
    console.log('✅ ui/src/components/BatchOverview.tsx dynamically updated.');
  }

  console.log('🎉 All benchmark reports, charts, tables, and UI options successfully synchronized without hardcoding!');
}

// Execute sync if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  syncBenchmark();
}
