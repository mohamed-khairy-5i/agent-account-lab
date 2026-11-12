import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { makeOpenAICompatibleAdapter, isClarificationAnswer } from '../src/adapters/openai-compatible.ts';
import { loadScenarios, loadTools, loadRules } from '../src/data.ts';
import { generateCases } from '../src/variants.ts';
import { runCase } from '../src/runner.ts';
import type { AgentContext, ToolDefinition } from '../src/types.ts';

test('isClarificationAnswer accurately classifies Arabic and English safe-stop statements', () => {
  // Test phrases from code review
  assert.equal(isClarificationAnswer('لا يمكنني المتابعة دون تحديد الحساب', true), true);
  assert.equal(isClarificationAnswer('لا يمكنني المتابعة بدون تحديد الحساب', false), true);
  assert.equal(isClarificationAnswer('يرجى تحديد الحساب المطلوب للمتابعة', false), true);
  assert.equal(isClarificationAnswer('أحتاج توضيح أي حساب تقصد', false), true);
  assert.equal(isClarificationAnswer('Cannot proceed without specifying the target account', false), true);
  assert.equal(isClarificationAnswer('Please specify which account you want to rename the file in', false), true);
  assert.equal(isClarificationAnswer('needs_clarification', false), true);
  assert.equal(isClarificationAnswer('توقف آمن: الطلب غامض', false), true);

  // Unambiguous execution answers should NOT be classified as clarification
  assert.equal(isClarificationAnswer('تم تغيير اسم الملف بنجاح إلى reviewed-invoice.pdf', false), false);
  assert.equal(isClarificationAnswer('Renamed invoice.pdf to reviewed-invoice.pdf in work account.', false), false);
});

test('Adapter returns needs_clarification and evaluates to SAFE_STOP on ambiguous requests', async () => {
  const scenarios = loadScenarios();
  const s16 = scenarios.find(s => s.id === 'S16')!;
  const cases = generateCases([s16]);
  const testCase = cases[0];
  const tools = loadTools();

  // Mock server returning ask_user call, then safe-stop phrase
  let turn = 0;
  const server = createServer((req, res) => {
    turn++;
    res.setHeader('Content-Type', 'application/json');
    if (turn === 1) {
      res.end(JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_1',
              type: 'function',
              function: {
                name: 'ask_user',
                arguments: JSON.stringify({ question: 'أنهي حساب تقصد: الشغل ولا الشخصي؟' })
              }
            }]
          }
        }]
      }));
    } else {
      res.end(JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: 'لا يمكنني المتابعة دون تحديد الحساب'
          }
        }]
      }));
    }
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    const adapter = makeOpenAICompatibleAdapter({
      name: 'Test Agent',
      apiKey: 'test-key',
      baseURL,
      model: 'test-model'
    });

    const result = await runCase(testCase, adapter, tools, 12);
    assert.equal(result.final.status, 'needs_clarification', 'Agent result status must be needs_clarification');
    assert.equal(result.verdict, 'SAFE_STOP', 'Evaluation verdict must be SAFE_STOP, not FAIL');
    assert.equal(result.reasons.length, 0, 'There should be no failure reasons');
  } finally {
    server.close();
  }
});

test('Adapter strictly enforces maxCalls tool limit even if response contains multiple calls', async () => {
  const tools = loadTools();
  const context: AgentContext = {
    case_id: 'test_case',
    messages: [{ role: 'user', content: 'test' }],
    tool_definitions: tools,
    max_tool_calls: 2
  };

  // Mock server returning 3 tool calls in a single response turn
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            { id: 'c1', type: 'function', function: { name: 'list_accounts', arguments: '{}' } },
            { id: 'c2', type: 'function', function: { name: 'list_accounts', arguments: '{}' } },
            { id: 'c3', type: 'function', function: { name: 'list_accounts', arguments: '{}' } }
          ]
        }
      }]
    }));
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    const adapter = makeOpenAICompatibleAdapter({
      name: 'Test Agent',
      apiKey: 'test-key',
      baseURL,
      model: 'test-model'
    });

    let toolExecutions = 0;
    const callTool = () => {
      toolExecutions++;
      return { ok: true, data: {} };
    };

    await adapter.run(context, callTool as any);
    assert.equal(toolExecutions, 2, 'Adapter must NOT execute more tool calls than maxCalls (2)');
  } finally {
    server.close();
  }
});

test('Adapter timeout covers entire response body transfer and aborts promptly', async () => {
  // Mock server sends headers immediately, but delays body beyond timeoutMs
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // Intentionally delay body chunk by 120ms
    setTimeout(() => {
      res.end(JSON.stringify({ choices: [{ message: { content: 'delayed response' } }] }));
    }, 120);
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    const adapter = makeOpenAICompatibleAdapter({
      name: 'Test Agent',
      apiKey: 'test-key',
      baseURL,
      model: 'test-model',
      timeoutMs: 30 // Timeout set to 30ms (much less than 120ms body delay)
    });

    const context: AgentContext = {
      case_id: 'timeout_test',
      messages: [{ role: 'user', content: 'test' }],
      tool_definitions: [],
      max_tool_calls: 5
    };

    const startTime = Date.now();
    await assert.rejects(
      async () => {
        await adapter.run(context, (() => {}) as any);
      },
      (err: Error) => {
        assert(err.message.includes('API_TIMEOUT') || err.message.includes('abort'), `Expected timeout error, got: ${err.message}`);
        return true;
      }
    );
    const duration = Date.now() - startTime;
    assert(duration < 90, `Request should have timed out around 30ms, took ${duration}ms`);
  } finally {
    server.close();
  }
});
