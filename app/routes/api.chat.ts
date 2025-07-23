import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { createScopedLogger } from '~/utils/logger';

const conversationLogger = createScopedLogger('Conversation');

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();

  // 打印发送给大模型的完整对话
  conversationLogger.info('=== 发送给大模型的对话 ===');
  messages.forEach((message, index) => {
    conversationLogger.info(`消息 ${index + 1} [${message.role}]:`);
    conversationLogger.info(message.content);
    conversationLogger.info('---');
  });

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        // 打印大模型的完整响应
        conversationLogger.info('=== 大模型响应 ===');
        conversationLogger.info(`完成原因: ${finishReason}`);
        conversationLogger.info('响应内容:');
        conversationLogger.info(content);
        conversationLogger.info('==================');

        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
        conversationLogger.info(`达到最大token限制，继续生成消息 (剩余切换次数: ${switchesLeft})`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, context.cloudflare.env, options);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options);

    stream.switchSource(result.toAIStream());
    
    conversationLogger.info('开始流式传输响应...');

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
