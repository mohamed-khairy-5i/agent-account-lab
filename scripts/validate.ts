import { loadScenarios, loadTools, loadRules } from '../src/data.ts';
import { validateScenario } from '../src/validate.ts';
import { generateCases } from '../src/variants.ts';
const scenarios=loadScenarios(), cases=generateCases(scenarios), tools=loadTools(), rules=loadRules();
const errors=cases.flatMap(c=>validateScenario(c.scenario).map(error=>({case_id:c.case_id,error})));
if(new Set(cases.map(c=>c.case_id)).size!==cases.length) errors.push({case_id:'all',error:'duplicate_case_id'});
for(const t of tools) if(t.input_schema.additionalProperties!==false) errors.push({case_id:t.name,error:'tool_allows_unknown_args'});
console.log(JSON.stringify({base_scenarios:scenarios.length,generated_cases:cases.length,mock_tools:tools.length,rules:rules.rules.length,errors},null,2));
if(errors.length) process.exitCode=1;
