// src/components/chat/ConfirmationCard.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmationCardProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationCard({ message, onConfirm, onCancel }: ConfirmationCardProps) {
  return (
    <div className="bg-surface-2 border border-warning/30 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-bottom-4 shadow-lg mx-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary mb-4">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-text-primary hover:bg-surface-offset rounded-lg transition-colors focus-visible-ring"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-red-700 rounded-lg transition-colors shadow-sm focus-visible-ring"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
