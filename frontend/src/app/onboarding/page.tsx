// src/app/onboarding/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel';
import { useIntegrationStore } from '@/stores/integrationStore';
import { StepConnectGoogle } from '@/components/onboarding/StepConnectGoogle';
import { StepConnectGmail } from '@/components/onboarding/StepConnectGmail';
import { StepApiKey } from '@/components/onboarding/StepApiKey';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signInWithGoogle, saveApiKey } = useAuthViewModel();
  const integrations = useIntegrationStore();
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (integrations.googleCalendarConnected && integrations.gmailConnected && currentStep !== 3) {
        // Automatically advance to step 3 if both are connected
        setCurrentStep(3);
      }
    }
  }, [isLoading, isAuthenticated, integrations, router, currentStep]);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      // In a real implementation, this would request the specific scopes
      await signInWithGoogle();
      // Assume success for now
      integrations.setIntegration('googleCalendarConnected', true);
      setCurrentStep(2);
    } catch (e) {
      console.error(e);
      setError("Failed to connect Google Calendar.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      // Request Gmail scopes
      await signInWithGoogle();
      integrations.setIntegration('gmailConnected', true);
      setCurrentStep(3);
    } catch (e) {
      console.error(e);
      setError("Failed to connect Gmail.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveKey = async (provider: string, key: string) => {
    setIsSavingKey(true);
    setError(null);
    try {
      const success = await saveApiKey(provider, key);
      if (success) {
        router.push('/briefing');
      } else {
        setError('Failed to save API key.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleChooseHosted = async () => {
    setIsSavingKey(true);
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.id), {
          plan: 'pro_hosted'
        });
        router.push('/briefing');
      }
    } catch (err) {
      setError('Failed to update plan.');
    } finally {
      setIsSavingKey(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col p-6">
      <div className="w-full max-w-4xl mx-auto flex justify-end mb-8">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-sm font-medium text-muted hover:text-text-primary transition-colors focus-visible-ring rounded"
        >
          Skip setup
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full">
        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H10V10H4V4Z" fill="currentColor" className="text-primary" />
              <path d="M14 4H20V10H14V4Z" fill="currentColor" className="text-primary" />
              <path d="M4 14H10V20H4V14Z" fill="currentColor" className="text-primary" />
            </svg>
            <span className="font-bold text-2xl tracking-tight text-text-primary">FlowMind</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4 w-full max-w-xs">
            <div className={cn("h-1 flex-1 rounded-full", currentStep >= 1 ? "bg-primary" : "bg-surface-offset")} />
            <div className={cn("h-1 flex-1 rounded-full", currentStep >= 2 ? "bg-primary" : "bg-surface-offset")} />
            <div className={cn("h-1 flex-1 rounded-full", currentStep >= 3 ? "bg-primary" : "bg-surface-offset")} />
          </div>
          <div className="text-sm font-medium text-muted">
            Step {currentStep} of 3: {currentStep === 1 ? 'Calendar' : currentStep === 2 ? 'Gmail' : 'AI Model'}
          </div>
        </div>

        <div className="w-full">
          {currentStep === 1 && (
            <div className="flex flex-col items-center">
              <StepConnectGoogle
                isConnected={integrations.googleCalendarConnected}
                onConnect={handleConnectGoogle}
                isLoading={isConnecting}
              />
              <button 
                onClick={() => setCurrentStep(2)}
                disabled={!integrations.googleCalendarConnected}
                className="mt-8 px-8 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white disabled:bg-surface-offset disabled:text-muted disabled:cursor-not-allowed transition-colors focus-visible-ring"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col items-center">
              <StepConnectGmail
                isConnected={integrations.gmailConnected}
                onConnect={handleConnectGmail}
                isLoading={isConnecting}
              />
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 rounded-xl font-semibold bg-surface hover:bg-surface-offset border border-border transition-colors focus-visible-ring"
                >
                  Back
                </button>
                <button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!integrations.gmailConnected && !integrations.googleCalendarConnected}
                  className="px-8 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white disabled:bg-surface-offset disabled:text-muted disabled:cursor-not-allowed transition-colors focus-visible-ring"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center w-full">
              <StepApiKey
                onSaveKey={handleSaveKey}
                onChooseHosted={handleChooseHosted}
                isSaving={isSavingKey}
                error={error}
              />
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-8 text-sm font-medium text-muted hover:text-text-primary transition-colors focus-visible-ring rounded"
              >
                Skip for now (use Free tier)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
