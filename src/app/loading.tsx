// src/app/loading.tsx
import React from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <LoadingSpinner size="lg" className="mb-4" />
      <span className="text-muted font-medium text-sm">FlowMind</span>
    </div>
  );
}
