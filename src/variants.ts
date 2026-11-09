import type { Scenario, TestCase } from './types.ts';
export const VARIANTS = ['base','reverse_accounts','flip_default','reverse_files','add_decoy'] as const;
export function generateCases(scenarios: Scenario[]): TestCase[] {
  return scenarios.flatMap(source => VARIANTS.map(variant => {
    const scenario = structuredClone(source);
    const world = scenario.world;
    if (variant === 'reverse_accounts') world.accounts.reverse();
    if (variant === 'reverse_files') world.files.reverse();
    if (variant === 'flip_default') {
      const next = world.accounts.find(account => !account.default)!;
      for (const account of world.accounts) account.default = account.account_id === next.account_id;
    }
    if (variant === 'add_decoy') {
      world.accounts.push({account_id:'acc_decoy',label:'إضافي',email:'mohamed@extra.example',default:false,permissions:['list_files','read_file','rename_file','move_file']});
      world.folders.push({folder_id:'decoy_inbox',account_id:'acc_decoy',name:'الوارد'},{folder_id:'decoy_archive',account_id:'acc_decoy',name:'الأرشيف'});
      for (const file of source.world.files.filter(file => file.account_id === 'acc_personal')) {
        world.files.push({...file,file_id:file.file_id.replace('personal_','decoy_'),account_id:'acc_decoy',folder_id:file.folder_id.replace('personal_','decoy_'),content:'بيانات حساب إضافي وهمية؛ ليست الإجابة المطلوبة.'});
      }
      if (scenario.oracle.allowed_read_accounts.length > 1) scenario.oracle.allowed_read_accounts.push('acc_decoy');
    }
    return {case_id:`${source.id}__${variant}`,variant,scenario};
  }));
}
