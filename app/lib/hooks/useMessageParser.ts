import type { Message } from 'ai';
import { useCallback, useState } from 'react';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');
const parserLogger = createScopedLogger('MessageParser');

const messageParser = new StreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      logger.trace('onArtifactOpen', data);

      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      logger.trace('onArtifactClose');

      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      logger.trace('onActionOpen', data.action);

      // we only add shell actions when when the close tag got parsed because only then we have the content
      if (data.action.type !== 'shell') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      logger.trace('onActionClose', data.action);

      if (data.action.type === 'shell') {
        workbenchStore.addAction(data);
      }

      workbenchStore.runAction(data);
    },
  },
});

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<{ [key: number]: string }>({});

  const parseMessages = useCallback((messages: Message[], isLoading: boolean) => {
    let reset = false;

    if (import.meta.env.DEV && !isLoading) {
      reset = true;
      messageParser.reset();
    }

    for (const [index, message] of messages.entries()) {
      if (message.role === 'assistant') {
        parserLogger.info(`=== 解析助手消息 ${index} ===`);
        parserLogger.info(`消息ID: ${message.id}`);
        parserLogger.info(`原始内容长度: ${message.content.length}`);
        parserLogger.info('原始内容:');
        parserLogger.info(message.content);
        
        const newParsedContent = messageParser.parse(message.id, message.content);
        
        parserLogger.info(`解析后内容长度: ${newParsedContent.length}`);
        parserLogger.info('解析后内容:');
        parserLogger.info(newParsedContent);
        parserLogger.info('========================');

        setParsedMessages((prevParsed) => ({
          ...prevParsed,
          [index]: !reset ? (prevParsed[index] || '') + newParsedContent : newParsedContent,
        }));
      }
    }
  }, []);

  return { parsedMessages, parseMessages };
}
