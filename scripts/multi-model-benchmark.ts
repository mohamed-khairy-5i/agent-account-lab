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

const MODELS_TO_EVALUATE = [
  { id: 'free/gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'free/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
  { id: 'free/qwen-3.8-max', label: 'Qwen 3.8 MAX' },
  { id: 'free/glm-5.3-flash', label: 'GLM-5.3 Flash' },
  { id: 'free/kimi-k3', label: 'Kimi K3' }
];

console.log(`=======================================================`);
console.log(`🏆 AGENT ACCOUNT LAB — FRONTIER MULTI-MODEL BENCHMARK`);
console.log(`Endpoint: ${baseURL}`);
console.log(`Models under test: ${MODELS_TO_EVALUATE.map(m => m.label).join(', ')}`);
console.log(`=======================================================\n`);

const cases = generateCases(loadScenarios());
const tools = loadTools();
const rules = loadRules();

// Curated 8 core cases covering the fundamental multi-account failure modes
const BENCHMARK_CASE_IDS = [
  'S01__base',              // Explicit work
  'S01__reverse_accounts',  // Position bias test on work
  'S02__base',              // Explicit personal
  'S07__base',              // Default trap (personal default, work target)
  'S08__base',              // Default trap (work default, personal target)
  'S09__base',              // Label collision (disambiguate by email)
  'S13__base',              // Ambiguity: must ask clarification
  'S16__base'               // Unspecified: must safe-stop without write
];

const selectedCases = BENCHMARK_CASE_IDS.map(id => {
  const found = cases.find(c => c.case_id === id);
  if (!found) throw new Error(`Missing benchmark case: ${id}`);
  return found;
});

const leaderboard: any[] = [];

for (const modelConfig of MODELS_TO_EVALUATE) {
  console.log(`\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  console.log(`Evaluating Model: ${modelConfig.label} (${modelConfig.id})`);
  console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);

  const adapter = makeOpenAICompatibleAdapter({
    name: modelConfig.label,
    apiKey,
    baseURL,
    model: modelConfig.id,
    temperature: 0,
    timeoutMs: 45000
  });

  const modelResults = [];
  let modelPass = 0;
  let modelSafeStop = 0;
  let modelFail = 0;
  let modelRateLimited = 0;
  let modelWrongWrites = 0;
  let totalLatency = 0;

  for (let i = 0; i < selectedCases.length; i++) {
    const tc = selectedCases[i];
    console.log(`  [${i + 1}/${selectedCases.length}] Case: ${tc.case_id}`);

    let caseSuccess = false;
    let attempt = 0;
    const maxCaseRetries = 3;

    while (!caseSuccess && attempt < maxCaseRetries) {
      attempt++;
      try {
        const startTime = Date.now();
        const res = await runCase(tc, adapter, tools, rules.max_tool_calls || 12);
        const duration = ((Date.now() - startTime) / 1000);

        // Check if the run failed due to 429 rate limit
        const isRateLimited = res.reasons.some(r => r.includes('429') || r.includes('Rate limit') || r.includes('RATE_LIMIT'));
        if (isRateLimited && attempt < maxCaseRetries) {
          console.log(`    ⚠️ Transient 429 rate limit hit on attempt ${attempt}. Backing off for 7s...`);
          await new Promise(r => setTimeout(r, 7000));
          continue;
        }

        totalLatency += duration;

        if (isRateLimited) {
          // If 429 rate limit persisted even after exhausting case retries,
          // isolate it as infrastructure unavailability (do not penalize model reasoning)
          modelRateLimited++;
          modelResults.push({
            case_id: tc.case_id,
            verdict: 'RATE_LIMITED',
            reasons: res.reasons,
            latency_s: duration.toFixed(1),
            wrong_writes: 0,
            rate_limit_retries: attempt - 1
          });
          console.log(`    ⚠️ Infrastructure Service Unavailable (429 Rate Limit after ${attempt} attempts)`);
          caseSuccess = true;
          continue;
        }

        if (res.verdict === 'PASS') modelPass++;
        else if (res.verdict === 'SAFE_STOP') modelSafeStop++;
        else modelFail++;

        if (res.metrics.mistargeted_write_effects > 0) {
          modelWrongWrites += res.metrics.mistargeted_write_effects;
        }

        modelResults.push({
          case_id: tc.case_id,
          verdict: res.verdict,
          reasons: res.reasons,
          latency_s: duration.toFixed(1),
          wrong_writes: res.metrics.mistargeted_write_effects,
          rate_limit_retries: attempt - 1
        });

        const icon = res.verdict === 'PASS' ? '✅' : (res.verdict === 'SAFE_STOP' ? '⏸️' : '❌');
        console.log(`    Result: ${icon} ${res.verdict} (${duration.toFixed(1)}s)`);
        if (res.reasons.length > 0) console.log(`    Reasons: ${JSON.stringify(res.reasons)}`);
        caseSuccess = true;
      } catch (err: any) {
        const isRateLimit = err.message.includes('429') || err.message.includes('Rate limit') || err.message.includes('RATE_LIMIT');
        if (isRateLimit && attempt < maxCaseRetries) {
          console.log(`    ⚠️ Caught 429 error on attempt ${attempt}. Waiting 7s before retry...`);
          await new Promise(r => setTimeout(r, 7000));
          continue;
        }

        if (isRateLimit) {
          // Isolate 429 infrastructure exhaustion from model behavioral evaluation
          modelRateLimited++;
          modelResults.push({
            case_id: tc.case_id,
            verdict: 'RATE_LIMITED',
            reasons: [`infrastructure_rate_limited:${err.message}`],
            latency_s: '0',
            wrong_writes: 0,
            rate_limit_retries: attempt - 1
          });
          console.log(`    ⚠️ Infrastructure Rate Limit Exceeded (isolated from model score): ${err.message}`);
          caseSuccess = true;
          continue;
        }

        modelFail++;
        modelResults.push({
          case_id: tc.case_id,
          verdict: 'FAIL',
          reasons: [`execution_error:${err.message}`],
          latency_s: '0',
          wrong_writes: 0,
          rate_limit_retries: attempt - 1
        });
        console.log(`    Error: ${err.message}`);
        caseSuccess = true;
      }
    }

    // Rate-limit pause
    await new Promise(r => setTimeout(r, 4300));
  }

  const completedEvaluations = modelPass + modelSafeStop + modelFail;
  const scorePct = completedEvaluations > 0 ? Math.round(((modelPass + modelSafeStop) / completedEvaluations) * 100) : 0;
  const avgLatency = (totalLatency / (completedEvaluations || 1)).toFixed(1);

  leaderboard.push({
    model_id: modelConfig.id,
    label: modelConfig.label,
    score_pct: scorePct,
    pass: modelPass,
    safe_stop: modelSafeStop,
    fail: modelFail,
    rate_limited: modelRateLimited,
    mistargeted_writes: modelWrongWrites,
    avg_latency_s: avgLatency,
    results: modelResults
  });

  console.log(`\n  Summary for ${modelConfig.label}: Score = ${scorePct}% (PASS: ${modelPass}, SAFE_STOP: ${modelSafeStop}, FAIL: ${modelFail}, Rate Limited: ${modelRateLimited}, Wrong Writes: ${modelWrongWrites})`);
}

// Sort leaderboard by score descending, then by lowest mistargeted writes, then lowest latency
leaderboard.sort((a, b) => b.score_pct - a.score_pct || a.mistargeted_writes - b.mistargeted_writes || Number(a.avg_latency_s) - Number(b.avg_latency_s));

const finalOutput = {
  timestamp: new Date().toISOString(),
  total_models: leaderboard.length,
  test_cases: BENCHMARK_CASE_IDS,
  leaderboard
};

writeFileSync(
  new URL('../reports/multi-model-benchmark.json', import.meta.url),
  JSON.stringify(finalOutput, null, 2)
);

console.log(`\n=======================================================`);
console.log(`🏆 FINAL LEADERBOARD RANKINGS`);
console.log(`=======================================================`);
console.table(leaderboard.map(m => ({
  'Rank': leaderboard.indexOf(m) + 1,
  'Model': m.label,
  'Score': `${m.score_pct}%`,
  'Pass': m.pass,
  'Safe Stop': m.safe_stop,
  'Fail': m.fail,
  'Wrong Writes': m.mistargeted_writes,
  'Avg Latency': `${m.avg_latency_s}s`
})));
console.log(`Results saved to reports/multi-model-benchmark.json`);
