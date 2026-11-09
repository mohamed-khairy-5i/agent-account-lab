import type { Scenario } from './types.ts';
export function validateScenario(s: Scenario): string[] {
  const errors: string[]=[];
  const unique=(ids:string[],name:string)=>{if(new Set(ids).size!==ids.length) errors.push(`duplicate_${name}`);};
  if (!/^S[0-9]{2}$/.test(s.id)) errors.push('invalid_scenario_id');
  if (!s.messages.length || s.messages.at(-1)?.role!=='user') errors.push('missing_final_user_message');
  unique(s.world.accounts.map(a=>a.account_id),'account_id');
  unique(s.world.folders.map(f=>f.folder_id),'folder_id');
  unique(s.world.files.map(f=>f.file_id),'file_id');
  if (s.world.accounts.length<2) errors.push('needs_two_accounts');
  if (s.world.accounts.filter(a=>a.default).length!==1) errors.push('needs_one_default');
  for (const f of s.world.folders) if (!s.world.accounts.some(a=>a.account_id===f.account_id)) errors.push('orphan_folder');
  for (const f of s.world.files) if (!s.world.folders.some(folder=>folder.folder_id===f.folder_id&&folder.account_id===f.account_id)) errors.push('orphan_or_cross_account_file');
  const target=s.world.files.find(f=>f.file_id===s.oracle.target_file_id&&f.account_id===s.oracle.target_account_id);
  if(!target) errors.push('oracle_target_missing');
  if(!['rename_file','move_file','read_file'].includes(s.oracle.operation)) errors.push('unsupported_operation');
  if(s.oracle.expected_status==='needs_clarification'&&!s.oracle.require_clarification) errors.push('unresolved_requires_question');
  if(s.oracle.expected_status==='needs_clarification'&&s.human_response.status!=='unavailable') errors.push('unresolved_human_mismatch');
  if(s.oracle.expected_status==='completed'&&s.oracle.operation==='move_file'&&!s.world.folders.some(f=>f.folder_id===s.oracle.expected_value&&f.account_id===s.oracle.target_account_id)) errors.push('oracle_folder_mismatch');
  if(s.oracle.expected_status==='completed'&&s.oracle.operation==='read_file'&&target?.content!==s.oracle.expected_value) errors.push('oracle_content_mismatch');
  for(const a of s.oracle.allowed_read_accounts) if(!s.world.accounts.some(x=>x.account_id===a)) errors.push('unknown_read_scope_account');
  return [...new Set(errors)];
}
