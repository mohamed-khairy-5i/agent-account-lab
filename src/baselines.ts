import type { AgentAdapter } from './types.ts';
// Deliberately weak controls. They read only the public messages and documented tool results.
export function makeNaiveBaseline(strategy:'first_account'|'default_account'): AgentAdapter {
  return {name:strategy,kind:'deterministic_negative_control',async run(context,call) {
    const listing=call('list_accounts',{});
    if (!listing.ok) return {status:'failed'};
    const accounts=listing.data.accounts;
    const account=strategy === 'first_account' ? accounts[0] : accounts.find((a:any)=>a.default);
    if (!account) return {status:'failed'};
    const text=context.messages.at(-1)!.content;
    const fileName=text.match(/(?:invoice\.pdf|report\.txt|notes\.txt)/i)?.[0];
    if (!fileName) return {status:'failed'};
    const listingFiles=call('list_files',{account_id:account.account_id,name:fileName});
    const file=listingFiles.ok ? listingFiles.data.files[0] : null;
    if (!file) return {status:'failed'};
    if (/اقرأ|محتوى|بالنص/.test(text)) {
      const result=call('read_file',{account_id:account.account_id,file_id:file.file_id});
      return result.ok ? {status:'completed',answer:result.data.content} : {status:'failed'};
    }
    if (/انقل|\bMove\b/.test(text)) {
      const archive=account.folders.find((f:any)=>f.name==='الأرشيف');
      const result=call('move_file',{account_id:account.account_id,file_id:file.file_id,target_folder_id:archive.folder_id});
      return {status:result.ok ? 'completed' : 'failed'};
    }
    const newName=text.match(/reviewed-[a-z-]+\.(?:pdf|txt)/)?.[0];
    if (!newName) return {status:'failed'};
    const result=call('rename_file',{account_id:account.account_id,file_id:file.file_id,new_name:newName});
    return {status:result.ok ? 'completed' : 'failed'};
  }};
}
