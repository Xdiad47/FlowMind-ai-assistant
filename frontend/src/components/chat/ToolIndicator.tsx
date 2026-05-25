// src/components/chat/ToolIndicator.tsx
import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { ToolCall } from '@/models/Message';
import { cn } from '@/lib/utils';

export interface ToolIndicatorProps {
  toolCall: ToolCall;
}

export function ToolIndicator({ toolCall }: ToolIndicatorProps) {
  const { status, label } = toolCall;

  return (
    <div className="flex items-center gap-2 bg-surface-offset border border-border rounded-lg px-4 py-2 text-sm w-max mb-4 animate-in fade-in slide-in-from-bottom-2">
      {status === 'running' && (
        <Loader2 className="w-4 h-4 text-muted animate-spin" />
      )}
      {status === 'done' && (
        <CheckCircle2 className="w-4 h-4 text-success" />
      )}
      {status === 'error' && (
        <XCircle className="w-4 h-4 text-error" />
      )}
      
      <span className={cn(
        "font-medium",
        status === 'done' ? "text-success" : 
        status === 'error' ? "text-error" : "text-muted"
      )}>
        {label}
      </span>
    </div>
  );
}
