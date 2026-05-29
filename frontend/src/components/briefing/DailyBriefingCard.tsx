// src/components/briefing/DailyBriefingCard.tsx
'use client';

import React from 'react';
import {
  RefreshCw,
  Mail,
  Calendar,
  ExternalLink,
  Video,
  MapPin,
  Users,
  Sparkles,
  Settings,
  Clock,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DailyBriefing, CalendarEventBrief, EmailHighlight } from '@/models/Briefing';

interface DailyBriefingCardProps {
  briefing: DailyBriefing | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function SourceBadge({ source }: { source: 'google' | 'microsoft' | 'gmail' | 'outlook' }) {
  const labels: Record<string, string> = {
    gmail: 'Gmail',
    google: 'Google Cal',
    outlook: 'Outlook',
    microsoft: 'Teams',
  };
  const isGoogle = source === 'google' || source === 'gmail';
  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded font-medium',
        isGoogle
          ? 'bg-blue-500/10 text-blue-400'
          : 'bg-violet-500/10 text-violet-400'
      )}
    >
      {labels[source] ?? source}
    </span>
  );
}

function EventCard({ event }: { event: CalendarEventBrief }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-surface-offset border border-border">
      <div className="flex flex-col items-center justify-start pt-0.5 min-w-[52px]">
        <span className="text-sm font-semibold text-primary">{formatTime(event.startTime)}</span>
        <span className="text-xs text-text-muted">{formatTime(event.endTime)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{event.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <SourceBadge source={event.source} />
          {event.attendeeCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Users className="w-3 h-3" />
              {event.attendeeCount}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-text-muted truncate max-w-[140px]">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      {event.meetLink && (
        <a
          href={event.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
        >
          <Video className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function EmailHighlightRow({
  highlight,
  onClick,
}: {
  highlight: EmailHighlight;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-lg bg-surface-offset border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold uppercase">
        {highlight.fromName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-text-primary truncate">{highlight.fromName}</span>
          <SourceBadge source={highlight.source} />
        </div>
        <p className="text-xs text-primary font-medium mb-0.5">{highlight.aiSummary}</p>
        <p className="text-xs text-text-muted truncate">{highlight.subject}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-text-muted shrink-0 mt-1" />
    </button>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-offset rounded', className)} />;
}

function BriefingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="h-4 w-48" />
      </div>
      <SkeletonLine className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-20 w-full rounded-lg" />
          <SkeletonLine className="h-20 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-20 w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="h-16 w-full rounded-lg" />
        <SkeletonLine className="h-16 w-full rounded-lg" />
        <SkeletonLine className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

function NoIntegrationsState({ onNavigate }: { onNavigate: (r: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">Connect your accounts</h3>
      <p className="text-text-muted text-sm max-w-xs mb-6">
        Connect Gmail, Google Calendar, Outlook, or Microsoft Calendar to get your daily AI briefing.
      </p>
      <button
        onClick={() => onNavigate('/settings')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        <Settings className="w-4 h-4" />
        Go to Settings
      </button>
    </div>
  );
}

export function DailyBriefingCard({
  briefing,
  isLoading,
  error,
  onRefresh,
  onNavigate,
}: DailyBriefingCardProps) {
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <BriefingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-text-muted mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface-offset transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!briefing) return null;

  const noIntegrations =
    !briefing.hasGmail &&
    !briefing.hasOutlook &&
    !briefing.hasGoogleCalendar &&
    !briefing.hasMicrosoftCalendar;

  if (noIntegrations) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <NoIntegrationsState onNavigate={onNavigate} />
        </div>
      </div>
    );
  }

  const totalEmails = briefing.gmailCount + briefing.outlookCount;
  const totalEvents = briefing.googleEvents.length + briefing.microsoftEvents.length;
  const hasEvents = totalEvents > 0;
  const hasEmails = totalEmails > 0;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 pb-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{briefing.greeting}</h1>
            <p className="text-text-muted text-sm mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(briefing.date)}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface-offset transition-colors"
            title="Refresh briefing"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Summary */}
        <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-text-primary leading-relaxed">{briefing.overallSummary}</p>
        </div>

        {/* Calendar Section */}
        {(briefing.hasGoogleCalendar || briefing.hasMicrosoftCalendar) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-primary" />
                Today's Events
              </h2>
              <button
                onClick={() => onNavigate('/calendar')}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                View calendar →
              </button>
            </div>

            {!hasEvents ? (
              <p className="text-sm text-text-muted py-3 px-4 rounded-lg bg-surface-offset border border-border">
                No events scheduled for today.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefing.hasGoogleCalendar && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Google Calendar</p>
                    {briefing.googleEvents.length === 0 ? (
                      <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-offset border border-border">
                        No events today
                      </p>
                    ) : (
                      briefing.googleEvents.map((e) => <EventCard key={e.id} event={e} />)
                    )}
                  </div>
                )}
                {briefing.hasMicrosoftCalendar && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Microsoft Calendar</p>
                    {briefing.microsoftEvents.length === 0 ? (
                      <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-offset border border-border">
                        No events today
                      </p>
                    ) : (
                      briefing.microsoftEvents.map((e) => <EventCard key={e.id} event={e} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Email Section */}
        {(briefing.hasGmail || briefing.hasOutlook) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary uppercase tracking-wide">
                <Mail className="w-4 h-4 text-primary" />
                Emails
                {totalEmails > 0 && (
                  <span className="text-xs font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {totalEmails} unread
                  </span>
                )}
              </h2>
              <button
                onClick={() => onNavigate('/inbox')}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                View inbox →
              </button>
            </div>

            {!hasEmails ? (
              <p className="text-sm text-text-muted py-3 px-4 rounded-lg bg-surface-offset border border-border">
                All caught up — no unread emails today.
              </p>
            ) : (
              <div className={cn(
                "grid gap-3",
                briefing.hasGmail && briefing.hasOutlook ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {briefing.hasGmail && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">Gmail</p>
                      {briefing.gmailCount > 0 && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
                          {briefing.gmailCount} unread
                        </span>
                      )}
                    </div>
                    {briefing.emailHighlights.filter(h => h.source === 'gmail').length === 0 ? (
                      <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-offset border border-border">
                        {briefing.gmailCount === 0 ? 'No unread emails' : 'No highlights available'}
                      </p>
                    ) : (
                      briefing.emailHighlights
                        .filter(h => h.source === 'gmail')
                        .map(h => (
                          <EmailHighlightRow
                            key={`gmail-${h.threadId}`}
                            highlight={h}
                            onClick={() => onNavigate('/inbox')}
                          />
                        ))
                    )}
                    {briefing.gmailCount > briefing.emailHighlights.filter(h => h.source === 'gmail').length && briefing.emailHighlights.filter(h => h.source === 'gmail').length > 0 && (
                      <button
                        onClick={() => onNavigate('/inbox')}
                        className="w-full py-1.5 text-xs text-text-muted hover:text-blue-400 transition-colors text-left pl-1"
                      >
                        +{briefing.gmailCount - briefing.emailHighlights.filter(h => h.source === 'gmail').length} more in Gmail →
                      </button>
                    )}
                  </div>
                )}
                {briefing.hasOutlook && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-violet-400 uppercase tracking-wide">Outlook</p>
                      {briefing.outlookCount > 0 && (
                        <span className="text-xs bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">
                          {briefing.outlookCount} unread
                        </span>
                      )}
                    </div>
                    {briefing.emailHighlights.filter(h => h.source === 'outlook').length === 0 ? (
                      <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-offset border border-border">
                        {briefing.outlookCount === 0 ? 'No unread emails' : 'No highlights available'}
                      </p>
                    ) : (
                      briefing.emailHighlights
                        .filter(h => h.source === 'outlook')
                        .map(h => (
                          <EmailHighlightRow
                            key={`outlook-${h.threadId}`}
                            highlight={h}
                            onClick={() => onNavigate('/inbox')}
                          />
                        ))
                    )}
                    {briefing.outlookCount > briefing.emailHighlights.filter(h => h.source === 'outlook').length && briefing.emailHighlights.filter(h => h.source === 'outlook').length > 0 && (
                      <button
                        onClick={() => onNavigate('/inbox')}
                        className="w-full py-1.5 text-xs text-text-muted hover:text-violet-400 transition-colors text-left pl-1"
                      >
                        +{briefing.outlookCount - briefing.emailHighlights.filter(h => h.source === 'outlook').length} more in Outlook →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
