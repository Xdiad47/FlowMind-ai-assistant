// src/models/ApiResponse.ts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface StreamEvent {
  type: 'token' | 'tool_start' | 'tool_end' | 'done' | 'error' | 'confirm';
  content?: string;
  toolName?: string;
  toolLabel?: string;
  result?: string;
  confirmMessage?: string;
}
