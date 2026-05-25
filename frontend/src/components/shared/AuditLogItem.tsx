// src/components/shared/AuditLogItem.tsx
import React from 'react';
import { Calendar, Mail, ScrollText, Settings } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from './Badge';
import type { AgentAction } from '@/models/AgentAction';

export interface AuditLogItemProps {
  action: AgentAction;
}

const categoryIcons = {
  calendar: Calendar,
  gmail: Mail,
  outlook: Mail,
  system: Settings,
};

export function AuditLogItem({ action }: AuditLogItemProps) {
  const Icon = categoryIcons[action.category] || ScrollText;

  let badgeVariant: 'success' | 'error' | 'warning' | 'default' = 'default';
  switch (action.status) {
    case 'success': badgeVariant = 'success'; break;
    case 'failed': badgeVariant = 'error'; break;
    case 'pending': badgeVariant = 'warning'; break;
    case 'cancelled': badgeVariant = 'default'; break;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-border last:border-0 hover:bg-surface-offset/50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-surface-offset flex items-center justify-center shrink-0 text-muted">
          <Icon className="w-4 h-4" />
        </div>
        <div className="truncate">
          <p className="text-sm font-medium text-text-primary truncate" title={action.description}>
            {action.description}
          </p>
          <span className="text-xs text-muted block sm:hidden mt-0.5">
            {formatRelativeTime(action.timestamp)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0 ml-11 sm:ml-0">
        <span className="text-xs text-muted hidden sm:block min-w-[80px] text-right">
          {formatRelativeTime(action.timestamp)}
        </span>
        <Badge variant={badgeVariant} className="capitalize w-20 justify-center">
          {action.status}
        </Badge>
      </div>
    </div>
  );
}
