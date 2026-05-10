// src/viewmodels/useSettingsViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import { getAuditLog, revokeIntegration as revokeIntegrationService } from '@/services/api/integrationService';
import { saveApiKey as saveApiKeyService, removeApiKey as removeApiKeyService, updateUserPermissions as updateUserPermissionsService, createOrUpdateUserProfile } from '@/services/api/authService';
import type { AgentAction } from '@/models/AgentAction';
import type { UserPermissions } from '@/models/User';

export function useSettingsViewModel() {
  const { user } = useAuthStore();
  const integrations = useIntegrationStore();
  const [auditLog, setAuditLog] = useState<AgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async (limit: number = 50) => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    const res = await getAuditLog(user.id, limit);
    if (res.success && res.data) {
      setAuditLog(res.data);
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const saveApiKey = async (provider: string, key: string) => {
    setIsSavingKey(true);
    setError(null);
    const res = await saveApiKeyService(provider, key);
    if (res.success) {
      integrations.setIntegration('apiKeySet', true);
      integrations.setApiProvider(provider);
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsSavingKey(false);
  };

  const removeApiKey = async () => {
    setError(null);
    const res = await removeApiKeyService();
    if (res.success) {
      integrations.setIntegration('apiKeySet', false);
      integrations.setApiProvider(null);
    } else if (res.error) {
      setError(res.error.message);
    }
  };

  const revokeIntegration = async (integration: 'googleCalendar' | 'gmail' | 'microsoftCalendar' | 'outlookMail') => {
    setError(null);
    const res = await revokeIntegrationService(integration);
    if (res.success) {
      if (integration === 'googleCalendar') integrations.setIntegration('googleCalendarConnected', false);
      if (integration === 'gmail') integrations.setIntegration('gmailConnected', false);
      if (integration === 'microsoftCalendar') integrations.setIntegration('microsoftCalendarConnected', false);
      if (integration === 'outlookMail') integrations.setIntegration('outlookConnected', false);
    } else if (res.error) {
      setError(res.error.message);
    }
  };

  const updatePermissions = async (permissions: Partial<UserPermissions>) => {
    if (!user?.id) return;
    setError(null);
    const res = await updateUserPermissionsService(user.id, permissions);
    if (!res.success && res.error) {
      setError(res.error.message);
    }
    // We expect auth store to trigger sync via useAuthViewModel typically, 
    // but in a strict MVVM we might want to update the store right here if needed.
  };

  const updateBriefingHour = async (hour: number) => {
    if (!user?.id) return;
    setError(null);
    const res = await createOrUpdateUserProfile(user.id, { briefingHour: hour });
    if (!res.success && res.error) {
      setError(res.error.message);
    }
  };

  return {
    user,
    integrations,
    auditLog,
    isLoading,
    isSavingKey,
    error,
    apiKeyProvider: integrations.apiProvider,
    saveApiKey,
    removeApiKey,
    revokeIntegration,
    updatePermissions,
    fetchAuditLog,
    updateBriefingHour,
  };
}
