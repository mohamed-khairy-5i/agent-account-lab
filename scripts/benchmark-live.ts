import { readFileSync, writeFileSync } from 'node:fs';
import { loadScenarios, loadTools, loadRules } from '../src/data.ts';
import { generateCases } from '../src/variants.ts';
import { runCase } from '../src/runner.ts';
import { makeOpenAICompatibleAdapter } from '../src/adapters/openai-compatible.ts';

// Load .env
const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.trim().split('=').map(p => p.trim()))
);

const apiKey = env.APINEX_API_KEY;
const baseURL = env.APINEX_BASE_URL || 'https://api.apinex.bond/v1';
const model = process.argv[2] || 'free/gemini-3.8-flash';

console.log(`=======================================================`);
console.log(`🤖 Agent Account Lab — Live Model Benchmark`);
console.log(`Model: ${model}`);
console.log(`Endpoint: ${baseURL}`);
console.log(`=======================================================\n`);

const cases = generateCases(loadScenarios());
const tools = loadTools();
const rules = loadRules();

// Curated diverse benchmark subset covering all failure modes:
// S01: Explicit target work
// S02: Explicit target personal
// S07: Default is personal but work requested
// S08: Default is work but personal requested
// S09: Identical account names, email specifies target
// S13: Ambiguous request requiring clarification question
// S16: Ambiguous request without clarification => must safe-stop
// S20: Explicit read constraint on personal account
const targetScenarios = ['S01', 'S02', 'S07', 'S08', 'S09', 'S13', 'S16', 'S20'];
const selectedCases = cases.filter(c => targetScenarios.includes(c.scenario.id) && ['base', 'reverse_accounts'].includes(c.variant));

console.log(`Running ${selectedCases.length} curated cases across 8 core families (base + reverse_accounts)...\n`);

const adapter = makeOpenAICompatibleAdapter({
  name: model,
  apiKey,
  baseURL,
  model,
  temperature: 0,
  timeoutMs: 45000
});

const benchmarkResults = [];

for (let i = 0; i < selectedCases.length; i++) {
  const tc = selectedCases[i];
  console.log(`[${i + 1}/${selectedCases.length}] Case: ${tc.case_id} (${tc.scenario.category})`);
  console.log(`  Prompt: "${tc.scenario.messages[0].content}"`);
  console.log(`  Expected: ${tc.scenario.oracle.operation} on ${tc.scenario.oracle.target_account_id}`);

  try {
    const startTime = Date.now();
    const res = await runCase(tc, adapter, tools, rules.max_tool_calls || 12);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    benchmarkResults.push({
      case_id: tc.case_id,
      base_id: tc.scenario.id,
      variant: tc.variant,
      category: tc.scenario.category,
      verdict: res.verdict,
      reasons: res.reasons,
      duration_s: duration,
      tool_calls: res.metrics.tool_calls,
      mistargeted_writes: res.metrics.mistargeted_write_effects,
      trace_summary: res.trace.map(t => `${t.tool}(${JSON.stringify(t.args)})`)
    });

    const icon = res.verdict === 'PASS' ? '✅' : (res.verdict === 'SAFE_STOP' ? '⏸️' : '❌');
    console.log(`  Result: ${icon} ${res.verdict} (${duration}s, ${res.metrics.tool_calls} tool calls)`);
    if (res.reasons.length > 0) console.log(`  Reasons: ${JSON.stringify(res.reasons)}`);
  } catch (err: any) {
    console.log(`  Execution Error: ${err.message}`);
    benchmarkResults.push({
      case_id: tc.case_id,
      base_id: tc.scenario.id,
      variant: tc.variant,
      category: tc.scenario.category,
      verdict: 'FAIL',
      reasons: [`execution_error:${err.message}`]
    });
  }

  console.log(`-------------------------------------------------------`);
  // Delay 4.2 seconds between cases to respect 15 RPM rate limit
  if (i < selectedCases.length - 1) {
    await new Promise(r => setTimeout(r, 4200));
  }
}

// Summary stats
const total = benchmarkResults.length;
const pass = benchmarkResults.filter(r => r.verdict === 'PASS').length;
const safeStop = benchmarkResults.filter(r => r.verdict === 'SAFE_STOP').length;
const fail = benchmarkResults.filter(r => r.verdict === 'FAIL').length;
const wrongWrites = benchmarkResults.filter(r => ((r as any).mistargeted_writes || 0) > 0).length;

const summary = {
  model,
  total_cases: total,
  pass,
  safe_stop: safeStop,
  fail,
  pass_rate: `${Math.round(((pass + safeStop) / total) * 100)}%`,
  mistargeted_writes: wrongWrites,
  timestamp: new Date().toISOString(),
  results: benchmarkResults
};

console.log(`\n=======================================================`);
console.log(`📊 FINAL BENCHMARK SCORE FOR ${model}`);
console.log(`Total Cases Tested: ${total}`);
console.log(`Passing (Compliant): ${pass} (${Math.round((pass / total) * 100)}%)`);
console.log(`Safe Stops (Honest Clarification): ${safeStop}`);
console.log(`Failures (Wrong Account Mutations): ${fail}`);
console.log(`Overall Compliance Rate: ${summary.pass_rate}`);
console.log(`=======================================================`);

writeFileSync(
  new URL('../reports/live-gemini-benchmark.json', import.meta.url),
  JSON.stringify(summary, null, 2)
);
console.log(`Full report saved to reports/live-gemini-benchmark.json`);
