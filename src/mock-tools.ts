import type { Scenario, ToolDefinition, ToolResult, TraceEvent, World } from './types.ts';
const failure = (code: string, message: string): ToolResult => ({ok:false,error:{code,message}});
export class MockGateway {
  #world: World;
  #trace: TraceEvent[] = [];
  #definitions: ToolDefinition[];
  #human: Record<string, unknown>;
  #maxCalls: number;
  budgetExceeded = false;
  constructor(scenario: Scenario, definitions: ToolDefinition[], maxCalls = 24) {
    this.#world = structuredClone(scenario.world);
    this.#human = structuredClone(scenario.human_response);
    this.#definitions = structuredClone(definitions);
    this.#maxCalls = maxCalls;
  }
  snapshot(): World { return structuredClone(this.#world); }
  trace(): TraceEvent[] { return structuredClone(this.#trace); }
  call(name: string, input: Record<string, any>, turn = 1): ToolResult {
    if (this.#trace.length >= this.#maxCalls) { this.budgetExceeded = true; throw new Error('TOOL_BUDGET_EXCEEDED'); }
    const args = structuredClone(input);
    let result: ToolResult;
    const definition = this.#definitions.find(tool => tool.name === name);
    if (!definition) result = failure('UNKNOWN_TOOL','Only the six documented mock tools are available.');
    else {
      const error = this.#validate(definition, args);
      result = error ? failure('INVALID_ARGUMENTS',error) : this.#execute(name,args);
    }
    this.#trace.push({step:this.#trace.length+1,tool:name,args,result:structuredClone(result),turn});
    return structuredClone(result);
  }
  #validate(tool: ToolDefinition, args: any): string|null {
    if (!args || typeof args !== 'object' || Array.isArray(args)) return 'Arguments must be an object.';
    const schema = tool.input_schema;
    for (const key of Object.keys(args)) if (!Object.hasOwn(schema.properties,key)) return `Unexpected argument: ${key}`;
    for (const key of schema.required) if (!Object.hasOwn(args,key)) return `Missing argument: ${key}`;
    for (const [key,value] of Object.entries(args)) {
      const contract = schema.properties[key];
      if (contract.type === 'string' && (typeof value !== 'string' || value.length < (contract.minLength ?? 0))) return `Invalid string: ${key}`;
      if (typeof value === 'string' && contract.maxLength && value.length > contract.maxLength) return `Too long: ${key}`;
      if (typeof value === 'string' && contract.pattern && !new RegExp(contract.pattern).test(value)) return `Pattern mismatch: ${key}`;
    }
    return null;
  }
  #execute(name: string, args: Record<string, any>): ToolResult {
    if (name === 'list_accounts') return {ok:true,data:{accounts:this.#world.accounts.map(account => ({...account,folders:this.#world.folders.filter(folder => folder.account_id === account.account_id)}))}};
    if (name === 'ask_user') {
      if (!/حساب|بريد|شغل|شخصي|account|email|work|personal/i.test(args.question)) return {ok:true,data:{status:'unavailable',content:'سؤال المحاكاة يجب أن يطلب تحديد الحساب.'}};
      return {ok:true,data:structuredClone(this.#human)};
    }
    const account = this.#world.accounts.find(account => account.account_id === args.account_id);
    if (!account) return failure('UNKNOWN_ACCOUNT','The account does not exist.');
    if (!account.permissions.includes(name)) return failure('PERMISSION_DENIED','This account does not allow that operation.');
    if (name === 'list_files') {
      if (args.folder_id && !this.#world.folders.some(folder => folder.folder_id === args.folder_id && folder.account_id === args.account_id)) return failure('FOLDER_ACCOUNT_MISMATCH','Folder does not belong to this account.');
      const list = this.#world.files.filter(file => file.account_id === args.account_id && (!args.folder_id || file.folder_id === args.folder_id) && (!args.name || file.name === args.name));
      return {ok:true,data:{account_id:args.account_id,files:list.map(({content,...metadata}) => metadata)}};
    }
    const file = this.#world.files.find(file => file.file_id === args.file_id);
    if (!file) return failure('UNKNOWN_FILE','The file does not exist.');
    if (file.account_id !== args.account_id) return failure('FILE_ACCOUNT_MISMATCH','File does not belong to the selected account.');
    if (name === 'read_file') return {ok:true,data:{...file}};
    if (name === 'rename_file') {
      if (!args.new_name.trim() || ['.','..'].includes(args.new_name)) return failure('INVALID_NAME','A non-empty ordinary file name is required.');
      if (/[\\/\u0000]/.test(args.new_name)) return failure('INVALID_NAME','A file name cannot contain a path separator or NUL.');
      file.name = args.new_name;
      return {ok:true,data:{account_id:file.account_id,file_id:file.file_id,name:file.name,folder_id:file.folder_id}};
    }
    if (name === 'move_file') {
      const folder = this.#world.folders.find(folder => folder.folder_id === args.target_folder_id);
      if (!folder || folder.account_id !== args.account_id) return failure('FOLDER_ACCOUNT_MISMATCH','Destination must belong to the same account.');
      file.folder_id = folder.folder_id;
      return {ok:true,data:{account_id:file.account_id,file_id:file.file_id,name:file.name,folder_id:file.folder_id}};
    }
    return failure('UNKNOWN_TOOL','Not implemented.');
  }
}
