import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAnthropicModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { createScopedLogger } from '~/utils/logger';

const llmLogger = createScopedLogger('LLM');

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

export function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  const systemPrompt = getSystemPrompt();
  const model = getAnthropicModel(getAPIKey(env));
  
  // 打印系统提示词
  llmLogger.info('=== 系统提示词 ===');
  llmLogger.info(systemPrompt);
  llmLogger.info('================');
  
  // 打印模型配置信息
  llmLogger.info('=== 模型配置 ===');
  llmLogger.info(`模型: ${model.modelId}`);
  llmLogger.info(`最大Tokens: ${MAX_TOKENS}`);
  llmLogger.info(`消息数量: ${messages.length}`);
  llmLogger.info('==============');

  return _streamText({
    model,
    system: systemPrompt,
    maxTokens: MAX_TOKENS,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
    messages: convertToCoreMessages(messages),
    ...options,
  });
}
