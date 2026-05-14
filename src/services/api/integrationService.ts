// src/services/api/integrationService.ts
import { doc, getDoc, collection, query, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiClient } from '../http/apiClient';
import type { User } from '@/models/User';
import type { AgentAction } from '@/models/AgentAction';
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

export async function checkIntegrationStatus(userId: string): Promise<ApiResponse<User['integrations']>> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' } };
    }
    
    const integrations = userDoc.data().integrations as User['integrations'];
    return { success: true, data: integrations, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export function connectMicrosoftIntegration(userId: string): void {
  window.location.href = `http://localhost:8000/auth/microsoft/login?user_id=${encodeURIComponent(userId)}`;
}

export async function revokeIntegration(integration: 'googleCalendar' | 'gmail' | 'microsoftCalendar' | 'outlookMail'): Promise<ApiResponse<void>> {
  try {
    await apiClient.post('/api/integrations/revoke', { integration });
    return { success: true, data: null, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}

export async function getAuditLog(userId: string, limit: number = 50): Promise<ApiResponse<AgentAction[]>> {
  try {
    const logRef = collection(db, 'users', userId, 'actionLog');
    const q = query(logRef, orderBy('timestamp', 'desc'), firestoreLimit(limit));
    const querySnapshot = await getDocs(q);
    
    const actions: AgentAction[] = [];
    querySnapshot.forEach((doc) => {
      actions.push(doc.data() as AgentAction);
    });
    
    return { success: true, data: actions, error: null };
  } catch (error) {
    return { success: false, data: null, error: createError(error) };
  }
}
