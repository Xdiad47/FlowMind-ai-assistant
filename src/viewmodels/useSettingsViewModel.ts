// src/viewmodels/useSettingsViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import { getAuditLog, revokeIntegration as revokeIntegrationService } from '@/services/api/integrationService';
import { saveApiKey as saveApiKeyService, removeApiKey as removeApiKeyService, updateUserPermissions as updateUserPermissionsService, createOrUpdateUserProfile } from '@/services/api/authService';
import type { AgentAction } from '@/models/AgentAction';
import type { UserPermissions } from '@/models/User';

export function useSettingsViewModel() {
  const { user, setUser } = useAuthStore();
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
      if (user) setUser({ ...user, apiProvider: provider as any, plan: 'pro_byok' });
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
      // Sync auth store: clear provider
      if (user) {
        setUser({ ...user, apiProvider: null, plan: 'free' });
      }
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

  const updatePermissions = async (changed: Partial<UserPermissions>) => {
    if (!user?.id) return;
    setError(null);
    // Merge with existing permissions — prevents partial update from wiping other fields
    const merged: UserPermissions = { ...(user.permissions ?? {}), ...changed } as UserPermissions;
    const res = await updateUserPermissionsService(user.id, merged);
    if (res.success) {
      // Optimistically update auth store so the UI reflects the change immediately
      setUser({ ...user, permissions: merged });
    } else if (res.error) {
      setError(res.error.message);
    }
  };

  const updateBriefingHour = async (hour: number) => {
    if (!user?.id) return;
    setError(null);
    const res = await createOrUpdateUserProfile(user.id, { briefingHour: hour });
    if (res.success) {
      setUser({ ...user, briefingHour: hour });
    } else if (res.error) {
      setError(res.error.message);
    }
  };

  const chooseHostedPlan = async () => {
    if (!user?.id) return;
    setError(null);
    const res = await createOrUpdateUserProfile(user.id, { plan: 'pro_hosted' });
    if (res.success) {
      setUser({ ...user, plan: 'pro_hosted', apiProvider: null });
      integrations.setIntegration('apiKeySet', true);
      integrations.setApiProvider('hosted');
    } else if (res.error) {
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
    chooseHostedPlan,
    fetchAuditLog,
    updateBriefingHour,
  };
}
