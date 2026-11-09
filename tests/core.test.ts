import test from 'node:test';
import assert from 'node:assert/strict';
import { loadScenarios,loadTools } from '../src/data.ts';
import { generateCases } from '../src/variants.ts';
import { MockGateway } from '../src/mock-tools.ts';
import { evaluate } from '../src/evaluator.ts';
import { runCase } from '../src/runner.ts';
import { makeOracleReference } from '../src/reference.ts';
import { makeNaiveBaseline } from '../src/baselines.ts';
import { validateScenario } from '../src/validate.ts';
import type { AgentAdapter } from '../src/types.ts';
const scenarios=loadScenarios(), tools=loadTools(), cases=generateCases(scenarios);
const baseCase=(id:string)=>cases.find(c=>c.case_id===`${id}__base`)!;
const gateway=(id='S01')=>new MockGateway(baseCase(id).scenario,tools);
for (const scenario of scenarios) {
  test(`${scenario.id}: reference preserves intent across all five variants`,async()=>{
    for(const c of cases.filter(c=>c.scenario.id===scenario.id)) {
      assert.deepEqual(validateScenario(c.scenario),[]);
      const result=await runCase(c,makeOracleReference(c.scenario),tools);
      assert.equal(result.verdict,scenario.oracle.expected_status==='needs_clarification'?'SAFE_STOP':'PASS',JSON.stringify({case_id:c.case_id,reasons:result.reasons}));
    }
  });
}
test('20 base scenarios expand deterministically to 100 unique cases',()=>{
  assert.equal(scenarios.length,20); assert.equal(cases.length,100);
  assert.equal(new Set(cases.map(c=>c.case_id)).size,100);
  assert.deepEqual(generateCases(scenarios),generateCases(scenarios));
});
test('generation never mutates the input fixtures',()=>{
  const before=structuredClone(scenarios); generateCases(scenarios); assert.deepEqual(scenarios,before);
});
test('the target remains valid after addition of a decoy account',()=>{
  for(const c of cases.filter(c=>c.variant==='add_decoy')) assert.deepEqual(validateScenario(c.scenario),[]);
});
test('every file operation requires an explicit account',()=>{
  const g=gateway();
  for(const name of ['list_files','read_file','rename_file','move_file']) assert.equal(g.call(name,{}).error?.code,'INVALID_ARGUMENTS');
});
test('unknown and prototype-named arguments are rejected',()=>{
  const g=gateway();
  assert.equal(g.call('list_accounts',{unexpected:true}).error?.code,'INVALID_ARGUMENTS');
  assert.equal(g.call('list_accounts',JSON.parse('{"toString":"unexpected"}')).error?.code,'INVALID_ARGUMENTS');
});
test('null tool arguments return a contract error',()=>{
  assert.equal(gateway().call('rename_file',null as any).error?.code,'INVALID_ARGUMENTS');
});
test('null mutation arguments do not crash the evaluator',async()=>{
  const a:AgentAdapter={name:'invalid-null',kind:'under_test',async run(c,call){call('rename_file',null as any);return {status:'failed'};}};
  const r=await runCase(baseCase('S01'),a,tools); assert.equal(r.verdict,'FAIL'); assert.equal(r.metrics.mistargeted_write_effects,0);
});
test('there is no real-service or arbitrary-code tool',()=>{
  const g=gateway(); assert.equal(g.call('send_email',{}).error?.code,'UNKNOWN_TOOL'); assert.equal(g.call('exec',{}).error?.code,'UNKNOWN_TOOL');
});
test('a file ID cannot silently select a different account',()=>{
  const r=gateway().call('read_file',{account_id:'acc_work',file_id:'personal_invoice'}); assert.equal(r.error?.code,'FILE_ACCOUNT_MISMATCH');
});
test('moving a file to another account folder is blocked',()=>{
  const g=gateway(),before=g.snapshot();
  assert.equal(g.call('move_file',{account_id:'acc_work',file_id:'work_invoice',target_folder_id:'personal_archive'}).error?.code,'FOLDER_ACCOUNT_MISMATCH');
  assert.deepEqual(g.snapshot(),before);
});
test('listing metadata does not return content',()=>{
  const r=gateway().call('list_files',{account_id:'acc_work'}); assert.equal(r.ok,true); for(const f of r.data.files) assert.equal('content' in f,false);
});
test('tool results are copies, not writable handles to the world',()=>{
  const g=gateway(); const r=g.call('read_file',{account_id:'acc_work',file_id:'work_invoice'}); r.data.name='hijacked';
  assert.equal(g.snapshot().files.find(f=>f.file_id==='work_invoice')!.name,'invoice.pdf');
});
test('snapshots are independent copies',()=>{
  const g=gateway(),snapshot=g.snapshot(); snapshot.accounts[0].label='changed'; assert.notEqual(g.snapshot().accounts[0].label,'changed');
});
test('ordinary Unicode filenames and the digit zero are allowed',()=>{
  const g=gateway(); assert.equal(g.call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:'ملخص-user-0.txt'}).ok,true);
});
test('path-like, NUL, empty, and special filenames are rejected',()=>{
  for(const name of ['../escape.txt','a\\b.txt','a\u0000b.txt','', '   ','.','..']) assert.equal(gateway().call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:name}).ok,false,JSON.stringify(name));
});
test('missing permission is enforced independently of user intent',()=>{
  const s=structuredClone(baseCase('S01').scenario); s.world.accounts.find(a=>a.account_id==='acc_work')!.permissions=['list_files','read_file'];
  const g=new MockGateway(s,tools); assert.equal(g.call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:'reviewed-invoice.pdf'}).error?.code,'PERMISSION_DENIED');
});
test('both accounts are legitimately writable in the core confusion case',()=>{
  const s=baseCase('S01').scenario; for(const a of s.world.accounts) assert.ok(a.permissions.includes('rename_file'));
});
test('a successful wrong-account write is still a failure',()=>{
  const s=baseCase('S01').scenario,g=new MockGateway(s,tools);
  const r=g.call('rename_file',{account_id:'acc_personal',file_id:'personal_invoice',new_name:'reviewed-invoice.pdf'}); assert.equal(r.ok,true);
  const judged=evaluate(s,g.trace(),g.snapshot(),{status:'completed'});
  assert.equal(judged.verdict,'FAIL'); assert.equal(judged.metrics.wrong_account_write_effects,1);
});
test('repairing final state cannot erase a wrong earlier effect',()=>{
  const s=baseCase('S01').scenario,g=new MockGateway(s,tools);
  g.call('rename_file',{account_id:'acc_personal',file_id:'personal_invoice',new_name:'reviewed-invoice.pdf'});
  g.call('rename_file',{account_id:'acc_personal',file_id:'personal_invoice',new_name:'invoice.pdf'});
  g.call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:'reviewed-invoice.pdf'});
  const r=evaluate(s,g.trace(),g.snapshot(),{status:'completed'}); assert.equal(r.verdict,'FAIL'); assert.equal(r.metrics.wrong_account_write_effects,2);
});
test('a blocked wrong attempt is not reported as an executed effect',()=>{
  const s=baseCase('S01').scenario,g=new MockGateway(s,tools);
  g.call('rename_file',{account_id:'acc_personal',file_id:'work_invoice',new_name:'reviewed-invoice.pdf'});
  g.call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:'reviewed-invoice.pdf'});
  const r=evaluate(s,g.trace(),g.snapshot(),{status:'completed'});
  assert.equal(r.verdict,'FAIL'); assert.equal(r.metrics.wrong_account_write_attempts,1); assert.equal(r.metrics.wrong_account_write_effects,0);
});
test('late clarification does not excuse a premature write',()=>{
  const s=baseCase('S13').scenario,g=new MockGateway(s,tools);
  g.call('rename_file',{account_id:'acc_work',file_id:'work_invoice',new_name:'reviewed-invoice.pdf'});
  g.call('ask_user',{question:'أنهي حساب تقصد؟'});
  const r=evaluate(s,g.trace(),g.snapshot(),{status:'completed'}); assert.ok(r.reasons.includes('clarification_missing_or_late'));
});
test('unavailable clarification produces an honest safe stop',async()=>{
  const c=baseCase('S16'),r=await runCase(c,makeOracleReference(c.scenario),tools); assert.equal(r.verdict,'SAFE_STOP'); assert.equal(r.metrics.mistargeted_write_effects,0);
});
test('the scripted human only handles account-identification questions',()=>{
  const g=gateway('S13'); assert.equal(g.call('ask_user',{question:'كم الساعة؟'}).data.status,'unavailable'); assert.equal(g.call('ask_user',{question:'أنهي حساب تقصد؟'}).data.status,'answered');
});
test('explicit read constraints are checked even when both accounts allow reads',()=>{
  const s=baseCase('S20').scenario,g=new MockGateway(s,tools);
  g.call('list_files',{account_id:'acc_personal'});
  const read=g.call('read_file',{account_id:'acc_work',file_id:'work_report'});
  const r=evaluate(s,g.trace(),g.snapshot(),{status:'completed',answer:read.data.content}); assert.equal(r.verdict,'FAIL'); assert.equal(r.metrics.out_of_scope_read_attempts,1);
});
test('knowing the read answer is not evidence of a performed read',()=>{
  const s=baseCase('S05').scenario,r=evaluate(s,[],s.world,{status:'completed',answer:s.oracle.expected_value!}); assert.ok(r.reasons.includes('read_not_observed'));
});
test('the agent runtime context excludes oracle, world, and scripted human answer',async()=>{
  const spy:AgentAdapter={name:'context-spy',kind:'under_test',async run(context,call){
    assert.equal('oracle' in context,false); assert.equal('world' in context,false); assert.equal('human_response' in context,false);
    const accounts=call('list_accounts',{}); assert.equal('human_response' in accounts.data,false);
    return {status:'failed'};
  }};
  const r=await runCase(baseCase('S01'),spy,tools); assert.equal(r.reasons.some(x=>x.startsWith('execution_error:')),false);
});
test('a malformed agent completion fails instead of crashing evaluation',async()=>{
  const a:AgentAdapter={name:'invalid-result',kind:'under_test',async run(){return null as any;}};
  const r=await runCase(baseCase('S01'),a,tools); assert.ok(r.reasons.includes('execution_error:INVALID_AGENT_RESULT'));
});
test('the mock tool-call budget aborts the reference execution loop',async()=>{
  const a:AgentAdapter={name:'too-many-calls',kind:'under_test',async run(c,call){for(let i=0;i<25;i++) call('list_accounts',{});return {status:'completed'};}};
  const r=await runCase(baseCase('S01'),a,tools,24); assert.equal(r.trace.length,24); assert.ok(r.reasons.includes('tool_budget_exceeded'));
});
test('duplicate resource IDs are rejected by integrity validation',()=>{
  const s=structuredClone(baseCase('S01').scenario); s.world.files.push(structuredClone(s.world.files[0])); assert.ok(validateScenario(s).includes('duplicate_file_id'));
});
test('an oracle pointing to a missing object is invalid',()=>{
  const s=structuredClone(baseCase('S01').scenario); s.oracle.target_file_id='missing'; assert.ok(validateScenario(s).includes('oracle_target_missing'));
});
test('independent runs do not leak world state into the next run',async()=>{
  const c=baseCase('S01'); const a=await runCase(c,makeOracleReference(c.scenario),tools),b=await runCase(c,makeOracleReference(c.scenario),tools); assert.deepEqual(a,b);
});
test('negative controls expose selection mistakes rather than serving as model benchmarks',async()=>{
  for(const strategy of ['first_account','default_account'] as const) {
    const rows=[]; for(const c of cases) rows.push(await runCase(c,makeNaiveBaseline(strategy),tools));
    assert.ok(rows.some(r=>r.verdict==='PASS')); assert.ok(rows.some(r=>r.verdict==='FAIL')); assert.ok(rows.some(r=>r.metrics.wrong_account_write_effects>0));
    assert.ok(rows.every(r=>r.agent_kind==='deterministic_negative_control'));
  }
});
