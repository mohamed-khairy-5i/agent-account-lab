export interface Account { account_id: string; label: string; email: string; default: boolean; permissions: string[] }
export interface Folder { folder_id: string; account_id: string; name: string }
export interface FileRecord { file_id: string; account_id: string; folder_id: string; name: string; content: string }
export interface World { accounts: Account[]; folders: Folder[]; files: FileRecord[] }
export interface Oracle { expected_status: 'completed'|'needs_clarification'; target_account_id: string; target_file_id: string; operation: string; require_clarification: boolean; allowed_read_accounts: string[]; expected_value: string|null }
export interface Scenario { id: string; title_ar: string; category: string; language: string; messages: {role: string; content: string}[]; world: World; human_response: Record<string, unknown>; oracle: Oracle }
export interface TestCase { case_id: string; variant: string; scenario: Scenario }
export interface ToolDefinition { name: string; description_ar: string; mutating: boolean; input_schema: Record<string, any> }
export interface ToolResult { ok: boolean; data?: any; error?: {code: string; message: string} }
export interface TraceEvent { step: number; tool: string; args: Record<string, any>; result: ToolResult }
export interface AgentContext { case_id: string; messages: {role: string; content: string}[]; tool_definitions: ToolDefinition[]; max_tool_calls: number }
export interface AgentResult { status: 'completed'|'needs_clarification'|'failed'; answer?: string }
export type CallTool = (name: string, args: Record<string, any>) => ToolResult;
export interface AgentAdapter { name: string; kind: 'oracle_reference'|'deterministic_negative_control'|'under_test'; run(context: AgentContext, callTool: CallTool): Promise<AgentResult> }
