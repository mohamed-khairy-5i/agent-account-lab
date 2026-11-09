import type { TestCase, ToolDefinition } from '../../src/types.ts';
import { generateCases } from '../../src/variants.ts';
import { runCase } from '../../src/runner.ts';
import { makeOracleReference } from '../../src/reference.ts';
import { makeNaiveBaseline } from '../../src/baselines.ts';
import { makeOpenAICompatibleAdapter } from '../../src/adapters/openai-compatible.ts';
import { loadBrowserScenarios, loadBrowserTools, loadBrowserRules } from './data-loader.ts';

export type AgentChoice = 
  | 'oracle-reference' 
  | 'first_account' 
  | 'default_account'
  | 'gemini-3.8-flash'
  | 'deepseek-v4.1-flash';

export interface SimulationResult {
  case_id: string;
  base_id: string;
  variant: string;
  agent_name: string;
  agent_kind: string;
  verdict: 'PASS' | 'SAFE_STOP' | 'FAIL';
  reasons: string[];
  metrics: {
    tool_calls: number;
    tool_errors: number;
    questions: number;
    unnecessary_questions: number;
    mistargeted_write_attempts: number;
    mistargeted_write_effects: number;
    wrong_account_write_attempts: number;
    wrong_account_write_effects: number;
    out_of_scope_read_attempts: number;
  };
  final: any;
  trace: any[];
  final_world: any;
}

export class SimulationHarness {
  private scenarios = loadBrowserScenarios();
  private allCases: TestCase[] = generateCases(this.scenarios);
  private tools: ToolDefinition[] = loadBrowserTools();
  private rules = loadBrowserRules();

  getScenarios() {
    return this.scenarios;
  }

  getCasesForScenario(scenarioId: string): TestCase[] {
    return this.allCases.filter(c => c.scenario.id === scenarioId);
  }

  getAllCases(): TestCase[] {
    return this.allCases;
  }

  async runSingle(testCase: TestCase, agentChoice: AgentChoice, apiKey?: string): Promise<SimulationResult> {
    const key = apiKey || localStorage.getItem('APINEX_API_KEY') || 'sk-apx3a50bf4e9bd5c0bf38c3a6be05cb5f84869ef0c00370f9b';

    let adapter;
    if (agentChoice === 'oracle-reference') {
      adapter = makeOracleReference(testCase.scenario);
    } else if (agentChoice === 'first_account' || agentChoice === 'default_account') {
      adapter = makeNaiveBaseline(agentChoice);
    } else if (agentChoice === 'gemini-3.8-flash') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'Gemini 3.8 Flash (Live)',
        apiKey: key,
        baseURL: '/api/llm',
        model: 'free/gemini-3.8-flash',
        temperature: 0
      });
    } else if (agentChoice === 'deepseek-v4.1-flash') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'DeepSeek V4.1 Flash (Live)',
        apiKey: key,
        baseURL: '/api/llm',
        model: 'free/deepseek-v4.1-flash',
        temperature: 0
      });
    } else {
      adapter = makeNaiveBaseline('first_account');
    }

    const maxCalls = this.rules.max_tool_calls || 12;
    return await runCase(testCase, adapter, this.tools, maxCalls) as SimulationResult;
  }

  async runAll(onProgress?: (completed: number, total: number) => void) {
    const totalRuns = this.allCases.length * 3;
    let completed = 0;
    const results: SimulationResult[] = [];

    const agents: AgentChoice[] = ['oracle-reference', 'first_account', 'default_account'];

    for (const testCase of this.allCases) {
      for (const agent of agents) {
        const res = await this.runSingle(testCase, agent);
        results.push(res);
        completed++;
        if (onProgress) onProgress(completed, totalRuns);
      }
    }

    return results;
  }
}
