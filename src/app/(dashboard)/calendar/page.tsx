// src/app/(dashboard)/calendar/page.tsx
'use client';

import React from 'react';
import { useCalendarViewModel } from '@/viewmodels/useCalendarViewModel';
import { Calendar, RefreshCw, AlertTriangle, Users, MapPin, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

const GOOGLE_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
const MS_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H11V11H2V2Z" fill="#F25022"/><path d="M13 2H22V11H13V2Z" fill="#7FBA00"/><path d="M2 13H11V22H2V13Z" fill="#00A4EF"/><path d="M13 13H22V22H13V13Z" fill="#FFB900"/></svg>';

export default function CalendarPage() {
  const router = useRouter();
  const {
    events, isLoading, todayEvents,
    eventsByDate, refreshEvents, currentMonth, navigateMonth,
    error, activeSource, setActiveSource, microsoftCalendarConnected
  } = useCalendarViewModel();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasBackToBack = todayEvents.length > 1 && todayEvents.some((event, idx) => {
    if (idx === todayEvents.length - 1) return false;
    const nextEvent = todayEvents[idx + 1];
    const diffMins = (new Date(nextEvent.startTime).getTime() - new Date(event.endTime).getTime()) / 60000;
    return diffMins >= 0 && diffMins <= 5;
  });

  const isMs = activeSource === 'microsoft';
  const eventColor = isMs
    ? 'bg-orange-500/15 text-orange-600 border-orange-500'
    : 'bg-primary/15 text-primary border-primary';
  const allDayColor = isMs
    ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500'
    : 'bg-accent/15 text-accent border-accent';
  const todayBarColor = isMs ? 'bg-orange-500' : 'bg-primary';

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 bg-base">
      <div className="max-w-7xl w-full mx-auto pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>

            {/* Source toggle */}
            <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setActiveSource('google')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  activeSource === 'google'
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text-primary"
                )}
              >
                <span className="w-3.5 h-3.5 inline-block" dangerouslySetInnerHTML={{ __html: GOOGLE_ICON }} />
                Google
              </button>
              <button
                onClick={() => {
                  if (!microsoftCalendarConnected) {
                    router.push('/settings');
                    return;
                  }
                  setActiveSource('microsoft');
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  activeSource === 'microsoft'
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-muted hover:text-text-primary",
                  !microsoftCalendarConnected && "opacity-50"
                )}
                title={!microsoftCalendarConnected ? "Connect Microsoft in Settings" : undefined}
              >
                <span className="w-3.5 h-3.5 inline-block" dangerouslySetInnerHTML={{ __html: MS_ICON }} />
                Microsoft
                {!microsoftCalendarConnected && <span className="text-[9px] leading-none opacity-70">connect</span>}
              </button>
            </div>

            {/* Month nav */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-1">
              <button onClick={() => navigateMonth(-1)} className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm font-semibold text-text-primary min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button onClick={() => navigateMonth(1)} className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary bg-surface hover:bg-surface-offset border border-border rounded-lg transition-colors"
              onClick={() => navigateMonth(-((currentMonth.getMonth() - new Date().getMonth()) + (currentMonth.getFullYear() - new Date().getFullYear()) * 12))}
            >
              Today
            </button>
            <button onClick={refreshEvents} disabled={isLoading} className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors">
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-3 mb-6 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map(day => (
                  <div key={day} className="px-2 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider">{day}</div>
                ))}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-7">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="min-h-[100px] border-b border-r border-border p-2">
                      <div className="w-6 h-4 bg-surface-offset rounded animate-pulse mb-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayStr = day.toDateString();
                    const dayEvents = eventsByDate[dayStr] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
                          !isCurrentMonth && "bg-surface-offset/50",
                          isCurrentDay && (isMs ? "bg-orange-500/5" : "bg-primary/5")
                        )}
                      >
                        <div className={cn(
                          "text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                          isCurrentDay
                            ? (isMs ? "bg-orange-500 text-white" : "bg-primary text-white")
                            : isCurrentMonth ? "text-text-primary" : "text-muted/50"
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => {
                            const isAllDay = !event.startTime.includes('T');
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium border-l-2",
                                  isAllDay ? allDayColor : eventColor
                                )}
                                title={`${event.title}${isAllDay ? ' (All day)' : ` — ${format(new Date(event.startTime), 'h:mm a')}`}`}
                              >
                                {isAllDay ? event.title : `${format(new Date(event.startTime), 'h:mm')} ${event.title}`}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted font-medium px-1.5">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={cn("w-4 h-4", isMs ? "text-orange-500" : "text-primary")} />
                <h3 className="font-bold text-text-primary">Today</h3>
              </div>
              <p className="text-xs text-muted mb-4">{format(new Date(), 'EEEE, MMMM d')}</p>

              {hasBackToBack && (
                <div className="bg-warning/10 border border-warning/20 text-warning px-3 py-2 rounded-lg flex items-center gap-2 mb-4 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Back-to-back meetings</span>
                </div>
              )}

              {todayEvents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted text-sm">Your day is clear! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map(event => (
                    <div key={event.id} className="bg-surface-2 border border-border rounded-lg p-3 relative overflow-hidden">
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", todayBarColor)} />
                      <div className="pl-2">
                        <h4 className="text-sm font-bold text-text-primary truncate">{event.title}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                          <Clock className="w-3 h-3" />
                          <span>{event.startTime.includes('T')
                            ? `${format(new Date(event.startTime), 'h:mm a')} – ${format(new Date(event.endTime), 'h:mm a')}`
                            : 'All day'
                          }</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4">This Month</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-lg p-3 text-center">
                  <p className={cn("text-2xl font-bold", isMs ? "text-orange-500" : "text-primary")}>{events.length}</p>
                  <p className="text-xs text-muted">Total Events</p>
                </div>
                <div className="bg-surface-2 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-text-primary">{todayEvents.length}</p>
                  <p className="text-xs text-muted">Today</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className={cn(
                "w-full py-3 px-4 text-white rounded-xl font-semibold text-sm transition-colors shadow-md",
                isMs ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" : "bg-primary hover:bg-primary-hover shadow-primary/20"
              )}
            >
              Ask FlowMind to schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
