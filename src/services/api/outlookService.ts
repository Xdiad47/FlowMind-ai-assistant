// src/services/api/outlookService.ts
import { apiClient } from '../http/apiClient';
import type { EmailThread, EmailContact } from '@/models/Email';
import type { ApiResponse, ApiError } from '@/models/ApiResponse';

function createError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) return error as ApiError;
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : String(error),
  };
}

function transformMessage(raw: Record<string, unknown>): EmailThread {
  const fromRaw = raw.from_contact as { email?: string; name?: string } | null | undefined;
  const from: EmailContact = {
    email: fromRaw?.email ?? '',
    name: fromRaw?.name ?? null,
  };
  return {
    id: raw.id as string,
    subject: (raw.subject as string) || '(No Subject)',
    snippet: (raw.snippet as string) ?? '',
    from,
    to: (raw.to as EmailContact[]) ?? [],
    date: (raw.date as string) ?? '',
    isRead: (raw.is_read as boolean) ?? false,
    isStarred: false,
    labels: [],
    source: 'outlook',
    messageCount: 1,
  };
}

export async function getOutlookInbox(maxResults: number = 30): Promise<ApiResponse<EmailThread[]>> {
  try {
    const res = await apiClient.get<{ success: boolean; data?: unknown[]; error?: ApiError }>(`/api/outlook/messages?max=${maxResults}`);
    if (!res.data.success) {
      return { success: false, data: null, error: res.data.error ?? { code: 'NOT_CONNECTED', message: 'Outlook not connected' } };
    }
    const raw = Array.isArray(res.data.data) ? res.data.data : [];
    return { success: true, data: raw.map((t) => transformMessage(t as Record<string, unknown>)), error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function searchOutlook(query: string, maxResults: number = 30): Promise<ApiResponse<EmailThread[]>> {
  try {
    const params = new URLSearchParams({ q: query, max: maxResults.toString() });
    const res = await apiClient.get<{ success: boolean; data?: unknown[]; error?: ApiError }>(`/api/outlook/search?${params.toString()}`);
    if (!res.data.success) {
      return { success: false, data: null, error: res.data.error ?? { code: 'NOT_CONNECTED', message: 'Outlook not connected' } };
    }
    const raw = Array.isArray(res.data.data) ? res.data.data : [];
    return { success: true, data: raw.map((t) => transformMessage(t as Record<string, unknown>)), error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
