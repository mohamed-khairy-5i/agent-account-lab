// TEST ORACLE ONLY. This adapter deliberately knows the answer. It is NOT model-performance evidence.
import type { AgentAdapter, Scenario } from './types.ts';
export function makeOracleReference(scenario: Scenario): AgentAdapter {
  const o=structuredClone(scenario.oracle);
  return {name:'oracle-reference',kind:'oracle_reference',async run(_context,call) {
    let turn = 1;
    call('list_accounts',{}, {turn});
    if (o.require_clarification) {
      const response=call('ask_user',{question:'أنهي حساب تقصد: الشغل ولا الشخصي؟'}, {turn});
      if (!response.ok || response.data.status !== 'answered') return {status:'needs_clarification'};
      turn++; // human answers; advancing to subsequent interaction turn
    }
    call('list_files',{account_id:o.target_account_id}, {turn});
    if (o.operation === 'read_file') {
      const response=call('read_file',{account_id:o.target_account_id,file_id:o.target_file_id}, {turn});
      return response.ok ? {status:'completed',answer:response.data.content} : {status:'failed'};
    }
    const args: Record<string,string>={account_id:o.target_account_id,file_id:o.target_file_id};
    if (o.operation === 'rename_file') args.new_name=o.expected_value!;
    else args.target_folder_id=o.expected_value!;
    const result=call(o.operation,args, {turn});
    return {status:result.ok ? 'completed' : 'failed'};
  }};
}
