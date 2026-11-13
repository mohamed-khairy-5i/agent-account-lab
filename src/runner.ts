import type { AgentAdapter, AgentContext, AgentResult, TestCase, ToolDefinition } from './types.ts';
import { MockGateway } from './mock-tools.ts';
import { evaluate } from './evaluator.ts';
export async function runCase(testCase: TestCase, adapter: AgentAdapter, definitions: ToolDefinition[], maxCalls=24) {
  const scenario=structuredClone(testCase.scenario);
  const gateway=new MockGateway(scenario,definitions,maxCalls);
  const context: AgentContext={case_id:testCase.case_id,messages:structuredClone(scenario.messages),tool_definitions:structuredClone(definitions),max_tool_calls:maxCalls};
  let final: AgentResult={status:'failed'};
  let executionError: string|null=null;
  try {
    const candidate=await adapter.run(context,(name,args,options)=>gateway.call(name,args,options?.turn,options?.blockedReason));
    if (!candidate || !['completed','needs_clarification','failed'].includes(candidate.status)) throw new Error('INVALID_AGENT_RESULT');
    final=candidate;
  }
  catch (error) { executionError=error instanceof Error ? error.message : 'UNKNOWN_EXECUTION_ERROR'; }
  const trace=gateway.trace();
  const finalWorld=gateway.snapshot();
  return {case_id:testCase.case_id,base_id:scenario.id,variant:testCase.variant,agent_name:adapter.name,agent_kind:adapter.kind,...evaluate(scenario,trace,finalWorld,final,executionError,gateway.budgetExceeded),final,trace,final_world:finalWorld};
}
