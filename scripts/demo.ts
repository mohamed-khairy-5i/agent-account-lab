import { writeFileSync, mkdirSync } from 'node:fs';
import { loadScenarios,loadTools,loadRules } from '../src/data.ts';
import { generateCases } from '../src/variants.ts';
import { runCase } from '../src/runner.ts';
import { makeOracleReference } from '../src/reference.ts';
import { makeNaiveBaseline } from '../src/baselines.ts';
const cases=generateCases(loadScenarios()),tools=loadTools(),max=loadRules().max_tool_calls;
const rows: Awaited<ReturnType<typeof runCase>>[] = [];
for(const c of cases) {
  rows.push(await runCase(c,makeOracleReference(c.scenario),tools,max));
  rows.push(await runCase(c,makeNaiveBaseline('first_account'),tools,max));
  rows.push(await runCase(c,makeNaiveBaseline('default_account'),tools,max));
}
const agents=[...new Set(rows.map(r=>r.agent_name))].map(name=>{
  const results=rows.filter(r=>r.agent_name===name);
  return {name,kind:results[0].agent_kind,total:results.length,pass:results.filter(r=>r.verdict==='PASS').length,safe_stop:results.filter(r=>r.verdict==='SAFE_STOP').length,fail:results.filter(r=>r.verdict==='FAIL').length,mistargeted_write_attempts:results.reduce((n,r)=>n+r.metrics.mistargeted_write_attempts,0),mistargeted_write_effects:results.reduce((n,r)=>n+r.metrics.mistargeted_write_effects,0)};
});
const report={version:'0.1.0-foundation',synthetic_only:true,real_model_calls:0,warning_ar:'هذه اختبارات لنواة المحاكاة ووكلاء برمجيين تجريبيين؛ ليست نتائج أداء نماذج ذكاء اصطناعي.',generated_cases:cases.length,runs:rows.length,agents};
mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});
writeFileSync(new URL('../reports/foundation-summary.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
writeFileSync(new URL('../reports/example-traces.json',import.meta.url),JSON.stringify(rows.filter(r=>['S01__base','S01__reverse_accounts','S16__base'].includes(r.case_id)).map(({final_world,...report})=>report),null,2)+'\n');
console.log(JSON.stringify(report,null,2));
