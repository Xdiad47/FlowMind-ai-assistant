// src/services/api/gmailService.ts
// All requests go through /api/proxy → backend (snake_case).
// transformThread converts backend fields to the camelCase EmailThread model.
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

// Backend returns snake_case; map to the frontend EmailThread shape here.
function transformThread(raw: Record<string, unknown>): EmailThread {
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
    isStarred: (raw.is_starred as boolean) ?? false,
    labels: (raw.labels as string[]) ?? [],
    source: 'gmail',
    messageCount: (raw.message_count as number) ?? 1,
  };
}

export async function getInboxThreads(maxResults: number = 30): Promise<ApiResponse<EmailThread[]>> {
  try {
    const res = await apiClient.get<{ data: unknown[] }>(`/api/gmail/threads?q=in:inbox&max=${maxResults}`);
    const raw = Array.isArray(res.data.data) ? res.data.data : [];
    return { success: true, data: raw.map((t) => transformThread(t as Record<string, unknown>)), error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function getThreads(query?: string, maxResults: number = 30): Promise<ApiResponse<EmailThread[]>> {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('max', maxResults.toString());
    const res = await apiClient.get<{ data: unknown[] }>(`/api/gmail/threads?${params.toString()}`);
    const raw = Array.isArray(res.data.data) ? res.data.data : [];
    return { success: true, data: raw.map((t) => transformThread(t as Record<string, unknown>)), error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function deleteThreads(threadIds: string[]): Promise<ApiResponse<void>> {
  try {
    // Backend Pydantic model expects snake_case: thread_ids
    await apiClient.delete('/api/gmail/threads', { data: { thread_ids: threadIds } });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function archiveThreads(threadIds: string[]): Promise<ApiResponse<void>> {
  try {
    // Route: /api/proxy/api/gmail/threads/archive → POST http://backend/api/gmail/threads/archive
    await apiClient.post('/api/gmail/threads/archive', { thread_ids: threadIds });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function markAsRead(threadIds: string[]): Promise<ApiResponse<void>> {
  try {
    // Route: /api/proxy/api/gmail/threads/mark-read → POST http://backend/api/gmail/threads/mark-read
    await apiClient.post('/api/gmail/threads/mark-read', { thread_ids: threadIds });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function draftReply(threadId: string, content: string): Promise<ApiResponse<void>> {
  try {
    await apiClient.post('/api/gmail/draft', { thread_id: threadId, content });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
