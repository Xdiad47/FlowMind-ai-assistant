// src/app/(dashboard)/inbox/page.tsx
'use client';

import React from 'react';
import { useInboxViewModel } from '@/viewmodels/useInboxViewModel';
import { EmptyState } from '@/components/shared/EmptyState';
import { Inbox, Search, Trash2, Archive, CheckCircle2, X } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

const GMAIL_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5v13a2 2 0 002 2h15a2 2 0 002-2v-13A2 2 0 0019.5 3.5h-15a2 2 0 00-2 2z" fill="#EA4335"/><path d="M2.5 5.5L12 12l9.5-6.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>';
const OUTLOOK_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4"/><path d="M15 8l8-4v16l-8-4V8z" fill="#0078D4"/><ellipse cx="8" cy="12" rx="4" ry="5" fill="white"/><ellipse cx="8" cy="12" rx="2.5" ry="3.5" fill="#0078D4"/></svg>';

export default function InboxPage() {
  const {
    threads, isLoading, selectedThreadIds, searchQuery,
    unreadCount, selectThread, selectAll, clearSelection,
    deleteSelected, archiveSelected, markSelectedAsRead,
    setSearchQuery, activeSource, setActiveSource, outlookConnected
  } = useInboxViewModel();

  const isOutlook = activeSource === 'outlook';

  return (
    <div className="h-full flex flex-col bg-base overflow-hidden relative">

      {/* Top Toolbar */}
      <div className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">

        {/* Source tabs */}
        <div className="flex items-center bg-surface-offset border border-border rounded-xl p-1 gap-0.5 shrink-0">
          <button
            onClick={() => setActiveSource('gmail')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              activeSource === 'gmail' ? "bg-[#EA4335] text-white shadow-sm" : "text-muted hover:text-text-primary"
            )}
          >
            <span className="w-3.5 h-3.5 inline-block" dangerouslySetInnerHTML={{ __html: GMAIL_ICON }} />
            Gmail
          </button>
          <button
            onClick={() => setActiveSource('outlook')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              activeSource === 'outlook' ? "bg-[#0078D4] text-white shadow-sm" : "text-muted hover:text-text-primary",
              !outlookConnected && "opacity-50"
            )}
            title={!outlookConnected ? "Connect Outlook in Settings" : undefined}
          >
            <span className="w-3.5 h-3.5 inline-block" dangerouslySetInnerHTML={{ __html: OUTLOOK_ICON }} />
            Outlook
            {!outlookConnected && <span className="text-[9px] opacity-70">connect</span>}
          </button>
        </div>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder={isOutlook ? "Search Outlook..." : "Search Gmail..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-offset border border-transparent focus:border-primary focus:bg-surface rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-muted"
            />
          </div>

          {selectedThreadIds.length > 0 && !isOutlook && (
            <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
              <div className="w-px h-6 bg-border mx-2" />
              <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors">
                <Trash2 className="w-4 h-4" /><span>Delete ({selectedThreadIds.length})</span>
              </button>
              <button onClick={archiveSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors">
                <Archive className="w-4 h-4" /><span>Archive</span>
              </button>
              <button onClick={markSelectedAsRead} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors">
                <CheckCircle2 className="w-4 h-4" /><span>Mark Read</span>
              </button>
              <button onClick={clearSelection} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-md transition-colors">
                <X className="w-4 h-4" /><span>Clear</span>
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center">
          {unreadCount > 0 && (
            <div className={cn(
              "border px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap",
              isOutlook ? "bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/20" : "bg-primary/10 text-primary border-primary/20"
            )}>
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {/* Outlook not connected banner */}
      {isOutlook && !outlookConnected && (
        <div className="bg-[#0078D4]/10 border-b border-[#0078D4]/20 px-6 py-3 text-sm text-[#0078D4] font-medium">
          Outlook is not connected. Go to <a href="/settings" className="underline font-bold">Settings</a> to connect your Microsoft account.
        </div>
      )}

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-6">

          {!isLoading && threads.length > 0 && selectedThreadIds.length === 0 && !isOutlook && (
            <div className="mb-4">
              <button onClick={selectAll} className="text-sm font-medium text-primary hover:underline">Select All</button>
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
                title={searchQuery ? "No results found" : `Your ${isOutlook ? 'Outlook' : 'Gmail'} inbox is empty`}
                description={searchQuery ? "Try adjusting your search query." : "Ask FlowMind to fetch or triage your emails."}
              />
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
              {threads.map(thread => {
                const isSelected = selectedThreadIds.includes(thread.id);
                const isUnread = !thread.isRead;
                const accentColor = isOutlook ? "border-l-[#0078D4]" : "border-l-primary";

                return (
                  <div
                    key={thread.id}
                    className={cn(
                      "group flex items-center gap-3 md:gap-4 px-4 py-3 md:py-4 border-b border-border last:border-0 hover:bg-surface-offset cursor-pointer transition-colors",
                      isUnread ? "bg-surface-2" : "bg-surface",
                      isSelected && `bg-primary/5 border-l-2 ${accentColor}`
                    )}
                    onClick={() => selectThread(thread.id)}
                  >
                    {!isOutlook && (
                      <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => selectThread(thread.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-surface bg-surface-offset"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                      <div className="md:w-48 shrink-0 truncate">
                        <span className={cn("text-sm truncate", isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary")}>
                          {thread.from?.name || thread.from?.email || 'Unknown Sender'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 truncate">
                        <span className={cn("text-sm mr-2", isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary")}>
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
                        isUnread ? `font-bold ${isOutlook ? 'text-[#0078D4]' : 'text-primary'}` : "font-medium text-muted"
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
