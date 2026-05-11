// src/app/(dashboard)/calendar/page.tsx
'use client';

import React from 'react';
import { useCalendarViewModel } from '@/viewmodels/useCalendarViewModel';
import { Calendar, RefreshCw, AlertTriangle, Users, MapPin, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const {
    events, isLoading, todayEvents,
    eventsByDate, refreshEvents, currentMonth, navigateMonth,
    error
  } = useCalendarViewModel();

  // Build calendar grid (6 weeks to cover any month layout)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Back-to-back detection for today
  const hasBackToBack = todayEvents.length > 1 && todayEvents.some((event, idx) => {
    if (idx === todayEvents.length - 1) return false;
    const nextEvent = todayEvents[idx + 1];
    const diffMins = (new Date(nextEvent.startTime).getTime() - new Date(event.endTime).getTime()) / 60000;
    return diffMins >= 0 && diffMins <= 5;
  });

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 bg-base">
      <div className="max-w-7xl w-full mx-auto pb-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm font-semibold text-text-primary min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-muted hover:text-text-primary bg-surface hover:bg-surface-offset border border-border rounded-lg transition-colors"
              onClick={() => {
                // Reset to current month
                navigateMonth(-((currentMonth.getMonth() - new Date().getMonth()) + 
                  (currentMonth.getFullYear() - new Date().getFullYear()) * 12));
              }}
            >
              Today
            </button>
            <button
              onClick={refreshEvents}
              disabled={isLoading}
              className="p-2 text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors focus-visible-ring"
              title="Refresh events"
            >
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
          {/* Calendar Grid (3/4) */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map(day => (
                  <div key={day} className="px-2 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
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
                          isCurrentDay && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                          isCurrentDay ? "bg-primary text-white" : isCurrentMonth ? "text-text-primary" : "text-muted/50"
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
                                "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium",
                                isAllDay
                                  ? "bg-accent/15 text-accent border-l-2 border-accent"
                                  : "bg-primary/15 text-primary border-l-2 border-primary"
                              )}
                              title={`${event.title}${isAllDay ? ' (All day)' : ` — ${format(new Date(event.startTime), 'h:mm a')}`}`}
                            >
                              {isAllDay ? event.title : `${format(new Date(event.startTime), 'h:mm')} ${event.title}`}
                            </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted font-medium px-1.5">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — Today's Events (1/4) */}
          <div className="flex flex-col gap-6">
            {/* Today panel */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
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
                    <div
                      key={event.id}
                      className="bg-surface-2 border border-border rounded-lg p-3 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
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

            {/* Stats */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4">This Month</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{events.length}</p>
                  <p className="text-xs text-muted">Total Events</p>
                </div>
                <div className="bg-surface-2 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-text-primary">{todayEvents.length}</p>
                  <p className="text-xs text-muted">Today</p>
                </div>
              </div>
            </div>

            {/* Quick action */}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-primary/20"
            >
              Ask FlowMind to schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
