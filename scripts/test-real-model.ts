import { readFileSync } from 'node:fs';
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
const filterScenario = process.argv[3]; // optional e.g. S07

console.log(`🚀 Testing Real Model: ${model}`);
console.log(`🔗 Endpoint: ${baseURL}`);
if (filterScenario) console.log(`🔍 Filtering scenario: ${filterScenario}\n`);

const cases = generateCases(loadScenarios());
const tools = loadTools();
const rules = loadRules();

const testCasesToRun = filterScenario 
  ? cases.filter(c => c.case_id.startsWith(filterScenario))
  : cases.filter(c => ['S01__base', 'S01__reverse_accounts'].includes(c.case_id));

const adapter = makeOpenAICompatibleAdapter({
  name: model,
  apiKey,
  baseURL,
  model,
  temperature: 0
});

for (const testCase of testCasesToRun) {
  console.log(`=======================================================`);
  console.log(`Case: ${testCase.case_id}`);
  console.log(`Prompt: "${testCase.scenario.messages[0].content}"`);
  console.log(`Target: ${testCase.scenario.oracle.target_account_id}`);
  
  const result = await runCase(testCase, adapter, tools, rules.max_tool_calls || 12);
  
  console.log(`Verdict: ${result.verdict}`);
  console.log(`Tool calls: ${result.metrics.tool_calls}`);
  if (result.reasons.length > 0) console.log(`Reasons: ${JSON.stringify(result.reasons)}`);
  console.log(`Trace:`);
  result.trace.forEach(t => {
    console.log(`  - #${t.step} ${t.tool}(${JSON.stringify(t.args)}) => ${t.result.ok ? 'OK' : 'ERR'}`);
  });
  console.log(`\n`);
}
