// src/app/(dashboard)/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsViewModel } from '@/viewmodels/useSettingsViewModel';
import { useIntegrationStore } from '@/stores/integrationStore';
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel';
import { IntegrationCard } from '@/components/shared/IntegrationCard';
import { StepApiKey } from '@/components/onboarding/StepApiKey';
import { Badge } from '@/components/shared/Badge';
import { LogOut, Trash2, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectMicrosoftIntegration } from '@/services/api/integrationService';

export default function SettingsPage() {
  const { user, isLoading, updatePermissions, updateBriefingHour, removeApiKey, revokeIntegration, chooseHostedPlan } = useSettingsViewModel();
  const permissions = user?.permissions ?? {
    canDeleteEmails: false, canSendEmails: false, canReplyEmails: false,
    canCreateEvents: true, canEditEvents: true, canDeleteEvents: false,
  };
  const briefingHour = user?.briefingHour ?? 8;
  const { googleCalendarConnected, gmailConnected, microsoftCalendarConnected, outlookConnected, setIntegration } = useIntegrationStore();
  const { signOut, user: authUser, saveApiKey } = useAuthViewModel();

  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ms = searchParams.get('microsoft');
    if (ms === 'connected') {
      setIntegration('microsoftCalendarConnected', true);
      setIntegration('outlookConnected', true);
      window.history.replaceState({}, '', '/settings');
    } else if (ms === 'error') {
      setKeyError('Microsoft connection failed. Check your Azure credentials and try again.');
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const handleConnect = async (provider: string) => {
    if (provider === 'googleCalendar' || provider === 'gmail') {
      window.location.href = '/api/auth/signin?callbackUrl=/settings';
    } else if (provider === 'microsoftCalendar' || provider === 'outlookMail') {
      if (!authUser?.id) return;
      connectMicrosoftIntegration(authUser.id);
    }
  };

  const handleRevoke = async (provider: string) => {
    await revokeIntegration(provider as 'googleCalendar' | 'gmail' | 'microsoftCalendar' | 'outlookMail');
  };

  const handleSaveKey = async (provider: string, key: string) => {
    setIsSavingKey(true);
    setKeyError(null);
    try {
      const success = await saveApiKey(provider, key);
      if (!success) setKeyError('Failed to save API key');
    } catch (e: any) {
      setKeyError(e.message || 'Error saving key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleChooseHosted = async () => {
    setIsSavingKey(true);
    try {
      await chooseHostedPlan();
    } catch (err) {
      setKeyError('Failed to update plan.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    await removeApiKey();
  };

  // Keys must match UserPermissions in src/models/User.ts
  const permissionList = [
    { key: 'canDeleteEmails', label: 'Allow deleting emails', desc: 'FlowMind can permanently trash emails.' },
    { key: 'canSendEmails', label: 'Allow sending emails', desc: 'FlowMind can send drafts and replies automatically.' },
    { key: 'canReplyEmails', label: 'Allow drafting replies', desc: 'FlowMind can create draft replies in Gmail.' },
    { key: 'canCreateEvents', label: 'Allow creating calendar events', desc: 'FlowMind can schedule new meetings.' },
    { key: 'canEditEvents', label: 'Allow editing calendar events', desc: 'FlowMind can reschedule or update existing events.' },
    { key: 'canDeleteEvents', label: 'Allow deleting calendar events', desc: 'FlowMind can cancel events from your calendar.' },
  ];

  if (isLoading || !user) {
    return (
      <div className="h-full p-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-offset rounded mb-8" />
        <div className="space-y-12">
          <div className="h-40 bg-surface-offset rounded-xl" />
          <div className="h-60 bg-surface-offset rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-base overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto pb-24 space-y-16">

        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-muted">Manage your connected apps, AI models, and permissions.</p>
        </div>

        {/* Section 1: Connected Accounts */}
        <section>
          <h2 className="text-xl font-bold mb-4">Connected Accounts</h2>
          {keyError && keyError.includes('Microsoft') && (
            <div className="mb-4 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
              {keyError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard
              name="Google Calendar"
              description="Read events and schedule meetings"
              icon='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>'
              isConnected={googleCalendarConnected}
              onConnect={() => handleConnect('googleCalendar')}
              onRevoke={() => handleRevoke('googleCalendar')}
              isLoading={false}
            />
            <IntegrationCard
              name="Gmail"
              description="Read, organize, and draft emails"
              icon='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5v13a2 2 0 002 2h15a2 2 0 002-2v-13A2 2 0 0019.5 3.5h-15a2 2 0 00-2 2z" fill="#EA4335"/><path d="M2.5 5.5L12 12l9.5-6.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>'
              isConnected={gmailConnected}
              onConnect={() => handleConnect('gmail')}
              onRevoke={() => handleRevoke('gmail')}
              isLoading={false}
            />
            <IntegrationCard
              name="Microsoft Calendar"
              description="Read events and schedule meetings via Microsoft Graph"
              icon='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H11V11H2V2Z" fill="#F25022"/><path d="M13 2H22V11H13V2Z" fill="#7FBA00"/><path d="M2 13H11V22H2V13Z" fill="#00A4EF"/><path d="M13 13H22V22H13V13Z" fill="#FFB900"/></svg>'
              isConnected={microsoftCalendarConnected}
              onConnect={() => handleConnect('microsoftCalendar')}
              onRevoke={() => handleRevoke('microsoftCalendar')}
              isLoading={false}
            />
            <IntegrationCard
              name="Outlook Mail"
              description="Read and search emails via Microsoft Outlook"
              icon='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4"/><path d="M15 8l8-4v16l-8-4V8z" fill="#0078D4"/><ellipse cx="8" cy="12" rx="4" ry="5" fill="white"/><ellipse cx="8" cy="12" rx="2.5" ry="3.5" fill="#0078D4"/></svg>'
              isConnected={outlookConnected}
              onConnect={() => handleConnect('outlookMail')}
              onRevoke={() => handleRevoke('outlookMail')}
              isLoading={false}
            />
          </div>
        </section>

        {/* Section 2: AI Model (BYOK) */}
        <section>
          <h2 className="text-xl font-bold mb-4">AI Model</h2>
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
            {user.apiProvider || user.plan === 'pro_hosted' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">Active AI Configuration</h3>
                    {user.plan === 'pro_hosted' ? (
                      <Badge variant="teal">FlowMind Hosted</Badge>
                    ) : (
                      <Badge variant="success" className="uppercase">{user.apiProvider}</Badge>
                    )}
                  </div>
                  <p className="text-muted text-sm flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    Your API key is encrypted with AES-256 and stored securely.
                  </p>
                </div>
                {user.plan !== 'pro_hosted' && (
                  <button
                    onClick={handleRemoveKey}
                    className="px-4 py-2 bg-surface-offset hover:bg-error/10 text-text-primary hover:text-error border border-border hover:border-error/20 rounded-xl transition-colors font-medium text-sm"
                  >
                    Remove Key
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-[-2rem]">
                <StepApiKey
                  onSaveKey={handleSaveKey}
                  onChooseHosted={handleChooseHosted}
                  isSaving={isSavingKey}
                  error={keyError}
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Permissions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Permissions</h2>
          <p className="text-sm text-muted mb-4">Control what FlowMind is allowed to do on your behalf.</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {permissionList.map(({ key, label, desc }) => {
              const isChecked = (permissions as unknown as Record<string, boolean>)[key] ?? false;

              return (
                <div key={key} className="p-4 md:p-6 flex items-center justify-between gap-4 hover:bg-surface-offset/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">{label}</h3>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={isChecked}
                    onClick={() => updatePermissions({ [key]: !isChecked })}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                      isChecked ? "bg-primary" : "bg-surface-offset"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isChecked ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Morning Briefing */}
        <section>
          <h2 className="text-xl font-bold mb-4">Morning Briefing</h2>
          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-medium text-text-primary mb-1">Daily Summary Time</h3>
              <p className="text-sm text-muted">Receive a daily summary of your calendar and top emails at this time.</p>
            </div>
            <select
              value={briefingHour}
              onChange={(e) => updateBriefingHour(Number(e.target.value))}
              className="bg-surface-2 border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none cursor-pointer w-full md:w-auto"
            >
              {[5, 6, 7, 8, 9, 10, 11].map(hour => (
                <option key={hour} value={hour}>{hour}:00 AM</option>
              ))}
            </select>
          </div>
        </section>

        {/* Section 5: Danger Zone */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-error/90">Danger Zone</h2>
          <div className="bg-surface border border-error/20 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {authUser?.name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-bold text-text-primary">{authUser?.name}</p>
                <p className="text-sm text-muted">{authUser?.email}</p>
              </div>
              <Badge variant="default" className="ml-auto uppercase text-[10px] tracking-widest">{user.plan}</Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={signOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-offset hover:bg-surface-2 text-text-primary rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    // TODO: implement account deletion endpoint
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 hover:bg-error/10 text-error rounded-xl font-medium transition-colors sm:ml-auto text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
