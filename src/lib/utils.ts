// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback if randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(iso)) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (isTomorrow(iso)) {
    return `Tomorrow, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatRelativeTime(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const date = new Date(iso);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));
  
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }
  
  const diffInDays = Math.round(diffInHours / 24);
  return rtf.format(diffInDays, 'day');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export function isTomorrow(iso: string): boolean {
  const date = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
}
