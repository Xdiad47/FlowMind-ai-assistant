// src/components/onboarding/StepConnectGmail.tsx
import React from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepConnectGmailProps {
  isConnected: boolean;
  onConnect: () => void;
  isLoading: boolean;
}

export function StepConnectGmail({ isConnected, onConnect, isLoading }: StepConnectGmailProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-md w-full mx-auto shadow-sm animate-in fade-in zoom-in-95">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 flex items-center justify-center">
          {/* Gmail icon color #EA4335 */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 5.5v13a2 2 0 002 2h15a2 2 0 002-2v-13A2 2 0 0019.5 3.5h-15a2 2 0 00-2 2z" fill="#EA4335" />
            <path d="M2.5 5.5L12 12l9.5-6.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-3">Connect Gmail</h2>
      <p className="text-center text-muted mb-8">
        FlowMind can organize your inbox, draft replies, and find important emails.
      </p>
      
      <ul className="space-y-4 mb-6">
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Read your emails</span>
        </li>
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Delete and archive emails</span>
        </li>
        <li className="flex items-start">
          <div className="mt-0.5 bg-primary/10 rounded-full p-1 shrink-0 mr-3">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Draft and send replies</span>
        </li>
      </ul>

      <div className="flex items-center gap-2 bg-surface-offset p-3 rounded-lg mb-8 text-xs text-muted">
        <Lock className="w-4 h-4 shrink-0 text-text-primary" />
        <p>FlowMind never reads email content without your explicit instruction.</p>
      </div>
      
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
          "Connect Gmail"
        )}
      </button>
    </div>
  );
}
