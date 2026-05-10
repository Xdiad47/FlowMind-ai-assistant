// src/components/shared/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-transparent border-primary inline-block",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
