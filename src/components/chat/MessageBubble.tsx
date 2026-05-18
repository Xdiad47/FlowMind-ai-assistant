// src/components/chat/MessageBubble.tsx
import React, { useState } from 'react';
import { RefreshCcw, CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/models/Message';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSending = message.status === 'sending';
  const isError = message.status === 'error';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col w-full mb-6 group", isUser ? "items-end" : "items-start")}>

      {/* Tool Calls inside Assistant Messages */}
      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <div className="flex flex-col gap-2 mb-2 ml-2">
          {message.toolCalls.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium w-max",
                tool.status === 'running' && "bg-surface-offset text-muted",
                tool.status === 'done' && "bg-success/10 text-success",
                tool.status === 'error' && "bg-error/10 text-error"
              )}
            >
              {tool.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {tool.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {tool.status === 'error' && <XCircle className="w-3.5 h-3.5" />}
              <span>{tool.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Bubble */}
      <div
        className={cn(
          "px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-white rounded-2xl rounded-tr-sm max-w-[75%]"
            : "bg-surface-2 text-text-primary rounded-2xl rounded-tl-sm max-w-[85%]",
          isSending && isUser && "animate-pulse opacity-80",
          isError && "border border-error/50 relative"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="break-words text-text-primary text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-lg font-semibold mt-3 mb-1 text-text-primary">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1 text-text-primary">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-text-primary">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic text-muted">{children}</em>,
                ul: ({ children }) => <ul className="my-1 pl-5 list-disc space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 pl-5 list-decimal space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                hr: () => <hr className="my-3 border-border" />,
                code: ({ children }) => <code className="bg-surface-offset px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted my-2">{children}</blockquote>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isLast && isSending && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-bounce align-middle" style={{ animationDuration: '1s' }} />
            )}
          </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className={cn(
        "flex items-center gap-2 mt-1 text-xs",
        isUser ? "mr-1 flex-row-reverse" : "ml-1"
      )}>
        <span className="text-muted">{formatRelativeTime(message.timestamp)}</span>

        {/* Copy button — always visible */}
        {!isSending && (
          <button
            onClick={handleCopy}
            className="text-muted hover:text-text-primary transition-colors"
            title="Copy message"
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-success" />
              : <Copy className="w-3.5 h-3.5" />
            }
          </button>
        )}

        {isError && (
          <span className="flex items-center text-error">
            Message failed <RefreshCcw className="w-3 h-3 ml-1 cursor-pointer hover:opacity-80" />
          </span>
        )}
      </div>

    </div>
  );
}
