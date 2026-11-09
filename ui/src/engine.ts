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
  | 'glm-5.3-flash'
  | 'kimi-k3'
  | 'deepseek-v4.1-flash'
  | 'qwen-3.8-max'
  | 'gemini-3.8-flash';

export const LIVE_LLM_MODELS: AgentChoice[] = [
  'glm-5.3-flash',
  'kimi-k3',
  'deepseek-v4.1-flash',
  'qwen-3.8-max',
  'gemini-3.8-flash'
];

export function isLiveLLM(agent: AgentChoice): boolean {
  return LIVE_LLM_MODELS.includes(agent);
}

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
    const key = (apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('APINEX_API_KEY') : '') || '').trim();
    const customBaseURL = (typeof localStorage !== 'undefined' ? localStorage.getItem('APINEX_BASE_URL') : '') || '/api/llm';

    if (isLiveLLM(agentChoice) && !key) {
      throw new Error('NO_API_KEY_CONFIGURED');
    }

    let adapter;
    if (agentChoice === 'oracle-reference') {
      adapter = makeOracleReference(testCase.scenario);
    } else if (agentChoice === 'first_account' || agentChoice === 'default_account') {
      adapter = makeNaiveBaseline(agentChoice);
    } else if (agentChoice === 'glm-5.3-flash') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'GLM-5.3 Flash (Live)',
        apiKey: key,
        baseURL: customBaseURL,
        model: 'free/glm-5.3-flash',
        temperature: 0
      });
    } else if (agentChoice === 'kimi-k3') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'Kimi K3 (Live)',
        apiKey: key,
        baseURL: customBaseURL,
        model: 'free/kimi-k3',
        temperature: 0
      });
    } else if (agentChoice === 'deepseek-v4.1-flash') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'DeepSeek V4.1 Flash (Live)',
        apiKey: key,
        baseURL: customBaseURL,
        model: 'free/deepseek-v4.1-flash',
        temperature: 0
      });
    } else if (agentChoice === 'qwen-3.8-max') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'Qwen 3.8 MAX (Live)',
        apiKey: key,
        baseURL: customBaseURL,
        model: 'free/qwen-3.8-max',
        temperature: 0
      });
    } else if (agentChoice === 'gemini-3.8-flash') {
      adapter = makeOpenAICompatibleAdapter({
        name: 'Gemini 3.8 Flash (Live)',
        apiKey: key,
        baseURL: customBaseURL,
        model: 'free/gemini-3.8-flash',
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
