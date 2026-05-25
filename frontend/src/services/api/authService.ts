// src/services/api/authService.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiClient } from '../http/apiClient';
import type { User, UserPermissions } from '@/models/User';
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

export async function getUserProfile(userId: string): Promise<ApiResponse<User>> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' } };
    }
    return { success: true, data: userDoc.data() as User, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function createOrUpdateUserProfile(userId: string, data: Partial<User>): Promise<ApiResponse<void>> {
  try {
    await setDoc(doc(db, 'users', userId), data, { merge: true });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function updateUserPermissions(userId: string, permissions: Partial<UserPermissions>): Promise<ApiResponse<void>> {
  try {
    await updateDoc(doc(db, 'users', userId), { permissions });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function saveApiKey(provider: string, key: string): Promise<ApiResponse<void>> {
  try {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to save API key');
    }
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function removeApiKey(): Promise<ApiResponse<void>> {
  try {
    const res = await fetch('/api/keys', { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to remove API key');
    }
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
