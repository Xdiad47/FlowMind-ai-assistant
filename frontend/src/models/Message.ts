// src/models/Message.ts
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ToolCall {
  id: string;
  toolName: string;
  status: 'running' | 'done' | 'error';
  label: string;       // e.g. "Checking your calendar..."
  result?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  toolCalls?: ToolCall[];
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type StreamEvent = 
  | { type: 'token'; content: string }
  | { type: 'tool_start'; toolName: string; toolLabel?: string }
  | { type: 'tool_end'; result?: string }
  | { type: 'confirm'; confirmMessage: string }
  | { type: 'done' }
  | { type: 'error'; content: string };
