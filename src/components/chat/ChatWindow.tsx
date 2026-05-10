// src/components/chat/ChatWindow.tsx
import React, { useRef, useEffect } from 'react';
import type { Message, ToolCall } from '@/models/Message';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ToolIndicator } from './ToolIndicator';
import { ConfirmationCard } from './ConfirmationCard';

export interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
  activeToolCall: ToolCall | null;
  pendingConfirmation: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
  onSendMessage: (content: string) => void;
  examplePrompts: string[];
  isIntegrationConnected: boolean;
}

export function ChatWindow({
  messages,
  isStreaming,
  activeToolCall,
  pendingConfirmation,
  onSendMessage,
  examplePrompts,
  isIntegrationConnected,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, messages[messages.length - 1]?.content, activeToolCall]);

  const showEmptyState = messages.length === 0;
  const initialPrompts = examplePrompts.slice(0, 3);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative bg-base">
      {/* Scrollable Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 scroll-smooth"
      >
        {!isIntegrationConnected && (
          <div className="mb-8 text-center bg-primary/10 text-primary px-4 py-3 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
            Connect Google Calendar or Gmail to get started →
          </div>
        )}

        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H10V10H4V4Z" fill="currentColor" className="text-primary" />
                <path d="M14 4H20V10H14V4Z" fill="currentColor" className="text-primary" />
                <path d="M4 14H10V20H4V14Z" fill="currentColor" className="text-primary" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">How can I help you today?</h2>
            
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {initialPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt)}
                  className="px-4 py-2 bg-surface border border-border rounded-full text-sm text-text-muted hover:text-primary hover:border-primary/50 transition-colors focus-visible-ring"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isLast={idx === messages.length - 1} 
              />
            ))}
            
            {/* Tool indicator appears below the latest message if a tool is running */}
            {activeToolCall && (
              <div className="ml-2">
                <ToolIndicator toolCall={activeToolCall} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base via-base to-transparent pt-10 pb-6 px-4 md:px-8">
        {pendingConfirmation && (
          <ConfirmationCard
            message={pendingConfirmation.message}
            onConfirm={pendingConfirmation.onConfirm}
            onCancel={pendingConfirmation.onCancel}
          />
        )}
        
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput 
            onSend={onSendMessage} 
            isStreaming={isStreaming} 
            disabled={pendingConfirmation !== null}
          />
          <p className="text-center text-xs text-muted mt-3">
            FlowMind can make mistakes. Consider verifying important actions.
          </p>
        </div>
      </div>
    </div>
  );
}
