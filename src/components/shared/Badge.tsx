// src/components/shared/Badge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'teal';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-offset text-text-primary border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  teal: 'bg-primary/10 text-primary border-primary/20',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
