// src/components/onboarding/StepConnectGoogle.tsx
import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepConnectGoogleProps {
  isConnected: boolean;
  onConnect: () => void;
  isLoading: boolean;
}

export function StepConnectGoogle({ isConnected, onConnect, isLoading }: StepConnectGoogleProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-md w-full mx-auto shadow-sm animate-in fade-in zoom-in-95">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
          {/* Google brand color #4285F4 */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-3">Connect Google Calendar</h2>
      <p className="text-center text-muted mb-8">
        FlowMind will read and manage your calendar events. You can revoke access anytime.
      </p>
      
      <ul className="space-y-4 mb-8">
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">View your calendar events</span>
        </li>
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Create and edit events</span>
        </li>
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Check your availability</span>
        </li>
      </ul>
      
      <button
        onClick={onConnect}
        disabled={isConnected || isLoading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-colors focus-visible-ring",
          isConnected
            ? "bg-success/10 text-success cursor-not-allowed border border-success/20"
            : isLoading
            ? "bg-primary/70 text-white cursor-not-allowed"
            : "bg-primary hover:bg-primary-hover text-white shadow-md"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isConnected ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Connected
          </>
        ) : (
          "Connect Google Calendar"
        )}
      </button>
    </div>
  );
}
