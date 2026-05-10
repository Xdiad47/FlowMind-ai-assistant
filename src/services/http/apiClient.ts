// src/services/http/apiClient.ts
import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/models/ApiResponse';

const apiClient = axios.create({
  baseURL: '/api/proxy',
  timeout: 60000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let normalizedError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
    };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown>;

      switch (status) {
        case 401:
          normalizedError.code = 'UNAUTHORIZED';
          break;
        case 403:
          normalizedError.code = 'FORBIDDEN';
          break;
        case 404:
          normalizedError.code = 'NOT_FOUND';
          break;
        case 429:
          normalizedError.code = 'RATE_LIMITED';
          break;
        case 500:
          normalizedError.code = 'SERVER_ERROR';
          break;
        default:
          normalizedError.code = `HTTP_ERROR_${status}`;
      }
      
      normalizedError.message = (data?.message as string) || normalizedError.message;
      normalizedError.details = data;
    }

    return Promise.reject(normalizedError);
  }
);

export { apiClient };

export async function streamFetch(endpoint: string, body: object): Promise<Response> {
  const response = await fetch(`/api/proxy${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`streamFetch failed with status ${response.status}`);
  }

  return response;
}
