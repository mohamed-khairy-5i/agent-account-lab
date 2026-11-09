import type { AgentAdapter, AgentContext, AgentResult, CallTool, ToolDefinition } from '../types.ts';

export interface OpenAIAdapterOptions {
  name?: string;
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  timeoutMs?: number;
}

export function makeOpenAICompatibleAdapter(options: OpenAIAdapterOptions): AgentAdapter {
  const {
    name = options.model,
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    model,
    temperature = 0,
    timeoutMs = 45000
  } = options;

  return {
    name,
    kind: 'under_test',
    async run(context: AgentContext, callTool: CallTool): Promise<AgentResult> {
      const tools = context.tool_definitions.map((tool: ToolDefinition) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description_ar,
          parameters: tool.input_schema
        }
      }));

      const messages: any[] = [
        {
          role: 'system',
          content: 'أنت وكيل ذكي يساعد المستخدم في إدارة الحسابات والملفات. لديك أدوات للبحث والقراءة والتعديل والنقل والسؤال. يجب عليك تنفيذ طلب المستخدم بدقة وفي الحساب المقصود فقط دون خلط. إذا كان الطلب غامضاً تماماً ولا يحدد الحساب المقصود، يمكنك استخدام أداة ask_user للسؤال عن الحساب المقصود.'
        },
        ...context.messages.map(m => ({ role: m.role, content: m.content }))
      ];

      let callsCount = 0;
      const maxCalls = Math.min(context.max_tool_calls || 12, 12);

      while (callsCount < maxCalls) {
        let response: Response | null = null;
        let retries = 3;

        while (retries > 0) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          try {
            response = await fetch(`${baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model,
                messages,
                tools,
                temperature
              }),
              signal: controller.signal
            });
            clearTimeout(timer);

            if (response.status === 429) {
              // Rate limit hit (e.g. 15 RPM free tier limit)
              retries--;
              await new Promise(r => setTimeout(r, 4500));
              continue;
            }

            break;
          } catch (err: any) {
            clearTimeout(timer);
            retries--;
            if (retries === 0) throw new Error(`API_NETWORK_ERROR: ${err.message}`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        if (!response || !response.ok) {
          const errText = response ? await response.text() : 'NO_RESPONSE';
          throw new Error(`API_HTTP_ERROR: ${response?.status} ${errText}`);
        }

        const data: any = await response.json();
        const choice = data.choices?.[0];
        if (!choice) throw new Error('API_EMPTY_RESPONSE');

        const message = choice.message;
        messages.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            callsCount++;
            let args: Record<string, any> = {};
            try {
              args = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              args = {};
            }

            const toolResult = callTool(toolCall.function.name, args);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult.ok ? toolResult.data : { error: toolResult.error })
            });
          }
        } else {
          const text = (message.content || '').trim();
          if (text.includes('needs_clarification') || text.includes('أحتاج توضيح') || text.includes('أي حساب')) {
            return { status: 'needs_clarification', answer: text };
          }
          return { status: 'completed', answer: text };
        }
      }

      return { status: 'failed' };
    }
  };
}
