// src/services/api/calendarService.ts
import { apiClient } from '../http/apiClient';
import type { CalendarEvent, TimeSlot } from '@/models/CalendarEvent';
import type { ApiResponse, ApiError } from '@/models/ApiResponse';

function createError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    return error as ApiError;
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : String(error),
  };
}

export async function getEvents(startDate: string, endDate: string): Promise<ApiResponse<CalendarEvent[]>> {
  try {
    const response = await apiClient.get<{ data: CalendarEvent[] }>(`/api/calendar/events?start=${startDate}&end=${endDate}`);
    return { success: true, data: response.data.data ?? response.data, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function createEvent(event: Partial<CalendarEvent>): Promise<ApiResponse<CalendarEvent>> {
  try {
    const response = await apiClient.post<{ data: CalendarEvent }>('/api/calendar/events', event);
    return { success: true, data: response.data.data ?? response.data, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<ApiResponse<CalendarEvent>> {
  try {
    const response = await apiClient.put<{ data: CalendarEvent }>(`/api/calendar/events/${eventId}`, event);
    return { success: true, data: response.data.data ?? response.data, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function deleteEvent(eventId: string): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/api/calendar/events/${eventId}`);
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function getMicrosoftEvents(startDate: string, endDate: string): Promise<ApiResponse<CalendarEvent[]>> {
  try {
    const response = await apiClient.get<{ data: CalendarEvent[] }>(`/api/calendar/microsoft/events?start=${startDate}&end=${endDate}`);
    return { success: true, data: response.data.data ?? response.data, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function getAvailability(startDate: string, endDate: string): Promise<ApiResponse<TimeSlot[]>> {
  try {
    const response = await apiClient.get<{ data: TimeSlot[] }>(`/api/calendar/availability?start=${startDate}&end=${endDate}`);
    return { success: true, data: response.data.data ?? response.data, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
