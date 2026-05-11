// src/viewmodels/useChatViewModel.ts
import { useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { sendMessage as sendMessageService, clearConversation as clearConversationService, saveConversation } from '@/services/api/chatService';
import { generateId } from '@/lib/utils';
import { TOOL_LABELS, EXAMPLE_PROMPTS } from '@/lib/constants';
import type { StreamEvent, Message } from '@/models/Message';

export function useChatViewModel() {
  const { user } = useAuthStore();
  const {
    messages,
    isStreaming,
    activeToolCall,
    pendingConfirmation,
    addMessage,
    updateLastMessage,
    finalizeLastMessage,
    setStreaming,
    setActiveToolCall,
    setPendingConfirmation,
    clearMessages
  } = useChatStore();

  const conversationIdRef = useRef(generateId());
  const sseBufferRef = useRef('');

  const _streamResponse = async (content: string) => {
    if (!user) return;

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      status: 'sending',
      timestamp: new Date().toISOString(),
    };
    addMessage(assistantMessage);

    setStreaming(true);
    sseBufferRef.current = '';

    try {
      const response = await sendMessageService({
        message: content,
        userId: user.id,
        conversationId: conversationIdRef.current,
      });

      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          sseBufferRef.current += chunk;

          const lines = sseBufferRef.current.split('\n');
          sseBufferRef.current = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;

              try {
                const event: StreamEvent = JSON.parse(dataStr);

                switch (event.type) {
                  case 'token':
                    if (event.content) {
                      updateLastMessage(event.content);
                    }
                    break;
                  case 'tool_start':
                    if (event.toolName) {
                      setActiveToolCall({
                        id: generateId(),
                        toolName: event.toolName,
                        label: TOOL_LABELS[event.toolName] ?? event.toolLabel ?? 'Running tool...',
                        status: 'running',
                      });
                    }
                    break;
                  case 'tool_end':
                    setActiveToolCall(null);
                    break;
                  case 'confirm':
                    if (event.confirmMessage) {
                      setPendingConfirmation({
                        message: event.confirmMessage,
                        onConfirm: confirmAction,
                        onCancel: cancelAction,
                      });
                    }
                    break;
                  case 'done':
                    finalizeLastMessage();
                    setStreaming(false);
                    // Save conversation using the live store state (not stale closure)
                    const currentMessages = useChatStore.getState().messages;
                    saveConversation(user.id, {
                      id: conversationIdRef.current,
                      userId: user.id,
                      messages: currentMessages.filter(m => m.role !== 'system'),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    break;
                  case 'error':
                    finalizeLastMessage();
                    setStreaming(false);
                    console.error('[Chat error]', event.content);
                    addMessage({
                      id: generateId(),
                      role: 'system',
                      status: 'error',
                      content: event.content || 'An error occurred during processing.',
                      timestamp: new Date().toISOString(),
                    });
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE JSON:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in _streamResponse:', error);
      finalizeLastMessage();
      setStreaming(false);
      addMessage({
        id: generateId(),
        role: 'system',
        status: 'error',
        content: 'Failed to send message or read stream.',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const confirmAction = async () => {
    if (!user) return;
    setPendingConfirmation(null);
    // Add a visible user message so the conversation shows what happened
    addMessage({
      id: generateId(),
      role: 'user',
      content: 'Yes, please proceed.',
      status: 'sent',
      timestamp: new Date().toISOString(),
    });
    await _streamResponse('Yes, please proceed.');
  };

  const cancelAction = () => {
    setPendingConfirmation(null);
    addMessage({
      id: generateId(),
      role: 'system',
      status: 'sent',
      content: 'Action cancelled.',
      timestamp: new Date().toISOString(),
    });
  };

  const clearChat = async () => {
    if (!user) return;
    clearMessages();
    await clearConversationService(user.id, conversationIdRef.current);
    conversationIdRef.current = generateId();
  };

  const sendMessage = async (content: string) => {
    if (isStreaming || !user) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    await _streamResponse(content);
  };

  return {
    messages,
    isStreaming,
    activeToolCall,
    pendingConfirmation,
    examplePrompts: EXAMPLE_PROMPTS,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
  };
}
