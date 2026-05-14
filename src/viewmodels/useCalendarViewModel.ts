// src/viewmodels/useCalendarViewModel.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getEvents, getMicrosoftEvents, getAvailability as getAvailabilityService } from '@/services/api/calendarService';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import type { CalendarEvent, TimeSlot } from '@/models/CalendarEvent';

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useCalendarViewModel() {
  const { user } = useAuthStore();
  const { microsoftCalendarConnected } = useIntegrationStore();
  const [activeSource, setActiveSource] = useState<'google' | 'microsoft'>('google');
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [microsoftEvents, setMicrosoftEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const fetchedMsMonths = useRef<Set<string>>(new Set());

  const dateRange = useMemo(() => getMonthRange(currentMonth), [currentMonth]);
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const fetchGoogleEvents = useCallback(async (start: string, end: string) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const res = await getEvents(start, end);
    if (res.success && res.data) setGoogleEvents(res.data);
    else if (res.error) setError(res.error.message);
    setIsLoading(false);
  }, [user]);

  const fetchMicrosoftEvents = useCallback(async (start: string, end: string, key: string) => {
    if (!user || !microsoftCalendarConnected) return;
    setIsLoading(true);
    setError(null);
    const res = await getMicrosoftEvents(start, end);
    if (res.success && res.data) {
      setMicrosoftEvents(res.data);
      fetchedMsMonths.current.add(key);
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsLoading(false);
  }, [user, microsoftCalendarConnected]);

  // Always fetch Google on mount/month change
  useEffect(() => {
    if (user) fetchGoogleEvents(dateRange.start, dateRange.end);
  }, [user, dateRange, fetchGoogleEvents]);

  // Fetch Microsoft when source switches or month changes (lazy, cached per month)
  useEffect(() => {
    if (activeSource === 'microsoft' && user && !fetchedMsMonths.current.has(monthKey)) {
      fetchMicrosoftEvents(dateRange.start, dateRange.end, monthKey);
    }
  }, [activeSource, dateRange, monthKey, fetchMicrosoftEvents, user]);

  const events = activeSource === 'google' ? googleEvents : microsoftEvents;

  const todayEvents = useMemo(() => {
    const todayStr = new Date().toDateString();
    return events.filter(e => new Date(e.startTime).toDateString() === todayStr);
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter(e => new Date(e.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const allEventsSorted = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const getAvailability = async (start: string, end: string): Promise<TimeSlot[]> => {
    const res = await getAvailabilityService(start, end);
    return res.success && res.data ? res.data : [];
  };

  const refreshEvents = useCallback(() => {
    if (activeSource === 'google') {
      fetchGoogleEvents(dateRange.start, dateRange.end);
    } else {
      fetchedMsMonths.current.delete(monthKey);
      fetchMicrosoftEvents(dateRange.start, dateRange.end, monthKey);
    }
  }, [activeSource, dateRange, monthKey, fetchGoogleEvents, fetchMicrosoftEvents]);

  const navigateMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dateStr = new Date(event.startTime).toDateString();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(event);
    }
    return map;
  }, [events]);

  return {
    events,
    googleEvents,
    microsoftEvents,
    activeSource,
    setActiveSource,
    microsoftCalendarConnected,
    isLoading,
    error,
    dateRange,
    currentMonth,
    todayEvents,
    upcomingEvents,
    allEventsSorted,
    eventsByDate,
    fetchEvents: fetchGoogleEvents,
    getAvailability,
    refreshEvents,
    navigateMonth,
  };
}
