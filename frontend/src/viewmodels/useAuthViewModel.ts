// src/viewmodels/useAuthViewModel.ts
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import { updateUserPermissions, saveApiKey as saveApiKeyService } from '@/services/api/authService';
import type { UserPermissions } from '@/models/User';

export function useAuthViewModel() {
  const { data: session, status } = useSession();
  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore();
  const { setIntegration } = useIntegrationStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function syncSession() {
      if (status === 'loading') {
        setLoading(true);
        return;
      }
      
      if (session?.user) {
        // @ts-expect-error - NextAuth session user types might not perfectly match our User model
        setUser(session.user);
        // Auth is resolved — unblock UI immediately
        setLoading(false);
        
        // Assume user id is populated by next-auth callback
        // @ts-expect-error
        const userId = session.user.id;
        
        if (userId) {
          setIsUpdating(true);
          try {
            const res = await fetch('/api/user');
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                const { integrations, apiProvider, plan } = data.data;
                if (integrations) {
                  setIntegration('googleCalendarConnected', integrations.googleCalendar);
                  setIntegration('gmailConnected', integrations.gmail);
                  setIntegration('microsoftCalendarConnected', integrations.microsoftCalendar);
                  setIntegration('outlookConnected', integrations.outlookMail);
                }
                if (apiProvider) setIntegration('apiKeySet', true);
                setIntegration('apiProvider', apiProvider ?? null);
                // Merge apiProvider + plan into user store so settings page reads them
                setUser({
                  ...(session.user as any),
                  apiProvider: apiProvider ?? null,
                  plan: plan ?? 'free',
                });
              }
            }
          } catch (err) {
            console.error('Failed to sync user integrations:', err);
          } finally {
            setIsUpdating(false);
          }
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    }

    syncSession();
  }, [session, status, setUser, setLoading, setIntegration]);

  const handleSignInWithGoogle = () => {
    signIn('google', { callbackUrl: '/onboarding' });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleUpdatePermissions = async (permissions: Partial<UserPermissions>) => {
    if (!user?.id) return;
    setIsUpdating(true);
    const res = await updateUserPermissions(user.id, permissions);
    if (!res.success && res.error) {
      setError(res.error.message);
    }
    setIsUpdating(false);
  };

  const saveApiKey = async (provider: string, key: string) => {
    setIsUpdating(true);
    const res = await saveApiKeyService(provider, key);
    let success = false;
    if (res.success) {
      setIntegration('apiKeySet', true);
      setIntegration('apiProvider', provider);
      // Update user store so settings page switches to "Active AI Configuration" card
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          apiProvider: provider as any,
          plan: 'pro_byok',
        });
      }
      success = true;
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsUpdating(false);
    return success;
  };

  return {
    user,
    isLoading: isLoading || status === 'loading',
    isAuthenticated,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    updatePermissions: handleUpdatePermissions,
    saveApiKey,
  };
}
