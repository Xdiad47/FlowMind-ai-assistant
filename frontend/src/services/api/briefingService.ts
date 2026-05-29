// src/services/api/briefingService.ts
import { apiClient } from '../http/apiClient';
import type { DailyBriefing, CalendarEventBrief, EmailHighlight } from '@/models/Briefing';
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

function deserialize(raw: Record<string, any>): DailyBriefing {
  const googleEvents: CalendarEventBrief[] = (raw.google_events ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    startTime: e.start_time,
    endTime: e.end_time,
    location: e.location ?? null,
    meetLink: e.meet_link ?? null,
    attendeeCount: e.attendee_count ?? 0,
    source: 'google' as const,
  }));

  const microsoftEvents: CalendarEventBrief[] = (raw.microsoft_events ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    startTime: e.start_time,
    endTime: e.end_time,
    location: e.location ?? null,
    meetLink: e.meet_link ?? null,
    attendeeCount: e.attendee_count ?? 0,
    source: 'microsoft' as const,
  }));

  const emailHighlights: EmailHighlight[] = (raw.email_highlights ?? []).map((h: any) => ({
    threadId: h.thread_id,
    subject: h.subject,
    fromName: h.from_name,
    fromEmail: h.from_email,
    snippet: h.snippet,
    aiSummary: h.ai_summary,
    source: h.source as 'gmail' | 'outlook',
  }));

  return {
    date: raw.date,
    greeting: raw.greeting,
    overallSummary: raw.overall_summary,
    gmailCount: raw.gmail_count ?? 0,
    outlookCount: raw.outlook_count ?? 0,
    googleEvents,
    microsoftEvents,
    emailHighlights,
    hasGmail: raw.has_gmail ?? false,
    hasOutlook: raw.has_outlook ?? false,
    hasGoogleCalendar: raw.has_google_calendar ?? false,
    hasMicrosoftCalendar: raw.has_microsoft_calendar ?? false,
  };
}

export async function getTodayBriefing(): Promise<ApiResponse<DailyBriefing>> {
  try {
    const response = await apiClient.get<{ data: Record<string, any> }>('/api/briefing/today');
    const raw = response.data.data ?? response.data;
    return { success: true, data: deserialize(raw), error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
