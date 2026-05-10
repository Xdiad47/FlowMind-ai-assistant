// src/viewmodels/useCalendarViewModel.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEvents, getAvailability as getAvailabilityService } from '@/services/api/calendarService';
import { useAuthStore } from '@/stores/authStore';
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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const dateRange = useMemo(() => getMonthRange(currentMonth), [currentMonth]);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    const res = await getEvents(start, end);
    if (res.success && res.data) {
      setEvents(res.data);
    } else if (res.error) {
      setError(res.error.message);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents(dateRange.start, dateRange.end);
    }
  }, [user, dateRange, fetchEvents]);

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
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  };

  const refreshEvents = useCallback(() => {
    fetchEvents(dateRange.start, dateRange.end);
  }, [dateRange, fetchEvents]);

  const navigateMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  // Group events by date string for calendar grid
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
    isLoading,
    error,
    dateRange,
    currentMonth,
    todayEvents,
    upcomingEvents,
    allEventsSorted,
    eventsByDate,
    fetchEvents,
    getAvailability,
    refreshEvents,
    navigateMonth,
  };
}

