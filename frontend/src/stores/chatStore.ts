// src/stores/chatStore.ts
import { create } from 'zustand';
import type { Message, ToolCall } from '@/models/Message';

interface PendingConfirmation {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  activeToolCall: ToolCall | null;
  pendingConfirmation: PendingConfirmation | null;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  finalizeLastMessage: () => void;
  setStreaming: (streaming: boolean) => void;
  setActiveToolCall: (tool: ToolCall | null) => void;
  setPendingConfirmation: (confirmation: PendingConfirmation | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  activeToolCall: null,
  pendingConfirmation: null,
  
  addMessage: (message) => 
    set((state) => ({ messages: [...state.messages, message] })),
    
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        messages[messages.length - 1] = {
          ...last,
          content: last.content + content,
        };
      }
      return { messages };
    }),

  finalizeLastMessage: () =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          status: 'sent',
        };
      }
      return { messages };
    }),
    
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setActiveToolCall: (activeToolCall) => set({ activeToolCall }),
  
  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),
  
  clearMessages: () => set({ messages: [], activeToolCall: null, pendingConfirmation: null })
}));
