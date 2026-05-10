// src/services/api/chatService.ts
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { streamFetch } from '../http/apiClient';
import type { Conversation } from '@/models/Message';
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

export async function sendMessage(payload: { message: string; userId: string; conversationId: string }): Promise<Response> {
  // Throws if fetch fails, as requested
  return await streamFetch('/api/chat/stream', payload);
}

export async function getConversationHistory(userId: string, conversationId: string): Promise<ApiResponse<Conversation>> {
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Conversation not found' } };
    }
    
    return { success: true, data: docSnap.data() as Conversation, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function saveConversation(userId: string, conversation: Conversation): Promise<ApiResponse<void>> {
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversation.id);
    await setDoc(docRef, conversation, { merge: true });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function clearConversation(userId: string, conversationId: string): Promise<ApiResponse<void>> {
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(docRef);
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
