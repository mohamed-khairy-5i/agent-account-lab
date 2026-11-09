// TEST ORACLE ONLY. This adapter deliberately knows the answer. It is NOT model-performance evidence.
import type { AgentAdapter, Scenario } from './types.ts';
export function makeOracleReference(scenario: Scenario): AgentAdapter {
  const o=structuredClone(scenario.oracle);
  return {name:'oracle-reference',kind:'oracle_reference',async run(_context,call) {
    call('list_accounts',{});
    if (o.require_clarification) {
      const response=call('ask_user',{question:'أنهي حساب تقصد: الشغل ولا الشخصي؟'});
      if (!response.ok || response.data.status !== 'answered') return {status:'needs_clarification'};
    }
    call('list_files',{account_id:o.target_account_id});
    if (o.operation === 'read_file') {
      const response=call('read_file',{account_id:o.target_account_id,file_id:o.target_file_id});
      return response.ok ? {status:'completed',answer:response.data.content} : {status:'failed'};
    }
    const args: Record<string,string>={account_id:o.target_account_id,file_id:o.target_file_id};
    if (o.operation === 'rename_file') args.new_name=o.expected_value!;
    else args.target_folder_id=o.expected_value!;
    const result=call(o.operation,args);
    return {status:result.ok ? 'completed' : 'failed'};
  }};
}
