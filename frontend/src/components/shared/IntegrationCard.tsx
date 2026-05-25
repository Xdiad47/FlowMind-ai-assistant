// src/components/shared/IntegrationCard.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

export interface IntegrationCardProps {
  name: string;
  description: string;
  icon: string;
  isConnected: boolean;
  onConnect: () => void;
  onRevoke: () => void;
  isLoading: boolean;
}

export function IntegrationCard({
  name,
  description,
  icon,
  isConnected,
  onConnect,
  onRevoke,
  isLoading,
}: IntegrationCardProps) {
  const isSvg = icon.trim().startsWith('<svg');

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-border/80 hover:shadow-sm">
      <div className="flex items-center gap-4 w-full">
        <div className="w-12 h-12 rounded-xl bg-surface-offset flex items-center justify-center shrink-0 overflow-hidden text-muted p-2">
          {isSvg ? (
            <div dangerouslySetInnerHTML={{ __html: icon }} className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
          ) : (
            <img src={icon} alt={`${name} logo`} className="w-full h-full object-contain" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-text-primary truncate">{name}</h3>
            {isConnected && <Badge variant="success">Connected</Badge>}
          </div>
          <p className="text-sm text-muted line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="shrink-0 w-full sm:w-auto flex justify-end">
        {isConnected ? (
          <button
            onClick={onRevoke}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors focus-visible-ring w-full sm:w-auto flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke"}
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors focus-visible-ring w-full sm:w-auto shadow-sm flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}
