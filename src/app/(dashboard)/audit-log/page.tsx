// src/app/(dashboard)/audit-log/page.tsx
'use client';

import React, { useState } from 'react';
import { useSettingsViewModel } from '@/viewmodels/useSettingsViewModel';
import { AuditLogItem } from '@/components/shared/AuditLogItem';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScrollText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
  const { auditLog, isLoading, fetchAuditLog } = useSettingsViewModel();
  const [filter, setFilter] = useState<'All' | 'Calendar' | 'Gmail' | 'System'>('All');
  const [limit, setLimit] = useState(20);

  const filteredLogs = auditLog.filter(log => {
    if (filter === 'All') return true;
    if (filter === 'Calendar' && log.category === 'calendar') return true;
    if (filter === 'Gmail' && log.category === 'gmail') return true;
    if (filter === 'System' && log.category === 'system') return true;
    return false;
  });

  const handleLoadMore = () => {
    const newLimit = limit + 20;
    setLimit(newLimit);
    fetchAuditLog(newLimit);
  };

  return (
    <div className="h-full flex flex-col bg-base overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl w-full mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Audit Log</h1>
          <p className="text-muted">Every action FlowMind has taken on your behalf.</p>
        </div>

        <div className="flex overflow-x-auto pb-2 mb-6 gap-2 hide-scrollbar">
          {['All', 'Calendar', 'Gmail', 'System'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible-ring border",
                filter === tab 
                  ? "bg-primary text-white border-primary" 
                  : "bg-surface text-muted hover:text-text-primary border-border hover:border-muted"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-2 md:p-4 shadow-sm min-h-[400px]">
          {isLoading && auditLog.length === 0 ? (
            <div className="space-y-2 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-surface-offset rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={ScrollText}
                title="No actions yet"
                description={`No ${filter === 'All' ? '' : filter.toLowerCase()} actions found in your audit log.`}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredLogs.map(log => (
                <AuditLogItem key={log.id} action={log} />
              ))}
              
              <div className="mt-6 flex justify-center pb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-medium bg-surface-offset hover:bg-surface-2 text-text-primary rounded-xl transition-colors focus-visible-ring flex items-center gap-2 border border-border"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
