// src/app/(dashboard)/inbox/page.tsx
'use client';

import React from 'react';
import { useInboxViewModel } from '@/viewmodels/useInboxViewModel';
import { EmptyState } from '@/components/shared/EmptyState';
import { Inbox, Search, Trash2, Archive, CheckCircle2, X } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function InboxPage() {
  const {
    threads, isLoading, selectedThreadIds, searchQuery,
    unreadCount, selectThread, selectAll,
    clearSelection, deleteSelected, archiveSelected,
    markSelectedAsRead, setSearchQuery
  } = useInboxViewModel();

  // Debounced search logic would go here ideally, but for now we'll just rely on the ViewModel
  // If the viewmodel doesn't debounce automatically, we can just trigger it here.
  // Assuming useInboxViewModel handles its own initial fetch.

  return (
    <div className="h-full flex flex-col bg-base overflow-hidden relative">
      
      {/* Top Toolbar */}
      <div className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6 shrink-0">
        
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-offset border border-transparent focus:border-primary focus:bg-surface rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-muted"
            />
          </div>
          
          {selectedThreadIds.length > 0 && (
            <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
              <div className="w-px h-6 bg-border mx-2" />
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedThreadIds.length})</span>
              </button>
              <button
                onClick={archiveSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
              <button
                onClick={markSelectedAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center">
          {unreadCount > 0 && (
            <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-6">
          
          {!isLoading && threads.length > 0 && selectedThreadIds.length === 0 && (
            <div className="mb-4">
              <button 
                onClick={selectAll}
                className="text-sm font-medium text-primary hover:underline"
              >
                Select All
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50 animate-pulse bg-surface/50 rounded-lg">
                  <div className="w-4 h-4 bg-surface-offset rounded shrink-0" />
                  <div className="w-32 h-4 bg-surface-offset rounded shrink-0" />
                  <div className="flex-1 h-4 bg-surface-offset rounded" />
                  <div className="w-16 h-4 bg-surface-offset rounded shrink-0" />
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="mt-12">
              <EmptyState
                icon={Inbox}
                title={searchQuery ? "No results found" : "Your inbox is empty"}
                description={searchQuery ? "Try adjusting your search query." : "Ask FlowMind to fetch or triage your emails."}
              />
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
              {threads.map(thread => {
                const isSelected = selectedThreadIds.includes(thread.id);
                const isUnread = !thread.isRead;

                return (
                  <div 
                    key={thread.id}
                    className={cn(
                      "group flex items-center gap-3 md:gap-4 px-4 py-3 md:py-4 border-b border-border last:border-0 hover:bg-surface-offset cursor-pointer transition-colors",
                      isUnread ? "bg-surface-2" : "bg-surface",
                      isSelected && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                    onClick={() => selectThread(thread.id)}
                  >
                    <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => selectThread(thread.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-surface bg-surface-offset"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                      <div className="md:w-48 shrink-0 truncate">
                        <span className={cn(
                          "text-sm truncate",
                          isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary"
                        )}>
                          {thread.from?.name || thread.from?.email || 'Unknown Sender'}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0 truncate">
                        <span className={cn(
                          "text-sm mr-2",
                          isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary"
                        )}>
                          {thread.subject || '(No Subject)'}
                        </span>
                        <span className="text-sm text-muted hidden md:inline truncate">
                          - {thread.snippet}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-right w-16 md:w-24">
                      <span className={cn(
                        "text-xs md:text-sm whitespace-nowrap",
                        isUnread ? "font-bold text-primary" : "font-medium text-muted"
                      )}>
                        {formatRelativeTime(thread.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
