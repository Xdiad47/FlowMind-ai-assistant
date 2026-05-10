// src/components/chat/ChatInput.tsx
import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isStreaming,
  disabled = false,
  placeholder = 'Message FlowMind...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = React.useState('');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && content.trim() && !disabled) {
        onSend(content.trim());
        setContent('');
      }
    }
  };

  const handleSendClick = () => {
    if (isStreaming) {
      onSend(''); // empty string as stop signal
    } else {
      if (content.trim() && !disabled) {
        onSend(content.trim());
        setContent('');
      }
    }
  };

  return (
    <div className={cn(
      "relative bg-surface border border-border rounded-xl p-3 shadow-md flex items-end gap-2",
      disabled && "opacity-60 cursor-not-allowed"
    )}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full bg-transparent resize-none outline-none max-h-[120px] py-1.5 text-base text-text-primary placeholder:text-muted overflow-y-auto",
          disabled && "cursor-not-allowed"
        )}
        style={{ minHeight: '44px' }}
      />
      
      <div className="flex flex-col items-end gap-1 shrink-0 mb-1">
        {content.length > 200 && (
          <span className="text-xs text-muted pr-1 absolute -top-5 right-2">
            {content.length}/2000
          </span>
        )}
        <button
          onClick={handleSendClick}
          disabled={disabled || (!isStreaming && !content.trim())}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors focus-visible-ring",
            isStreaming
              ? "bg-error hover:bg-red-700 text-white"
              : (!content.trim() || disabled)
              ? "bg-surface-offset text-muted cursor-not-allowed"
              : "bg-primary hover:bg-primary-hover text-white"
          )}
          title={isStreaming ? "Stop generation" : "Send message"}
        >
          {isStreaming ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
