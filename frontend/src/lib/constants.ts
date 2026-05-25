// src/lib/constants.ts

/**
 * Canonical backend base URL — reads from env vars, falls back to localhost for dev.
 * Use this everywhere a direct backend URL is needed (e.g. OAuth redirects).
 * Strip trailing slashes so callers can always safely append '/path'.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:8000'
).replace(/\/+$/, '');

export const APP_NAME = 'FlowMind';
export const APP_TAGLINE = 'Your AI Chief of Staff';
export const APP_DESCRIPTION = 'Manage your calendar and inbox with natural language. Sign up, connect, and just talk.';

export const PLANS = {
  FREE: { id: 'free', name: 'Free', price: { inr: 0, usd: 0 }, actions: 100, features: ['100 AI actions per month', 'Google Calendar integration', 'Gmail integration', 'Standard support'] },
  PRO_BYOK: { id: 'pro_byok', name: 'Pro BYOK', price: { inr: 499, usd: 6 }, actions: -1, features: ['Unlimited AI actions', 'Bring your own API key', 'Full integrations', 'Priority support'] },
  PRO_HOSTED: { id: 'pro_hosted', name: 'Pro Hosted', price: { inr: 999, usd: 12 }, actions: -1, features: ['Unlimited AI actions', 'Hosted Llama 3 70B', 'Full integrations', 'Priority support'] },
  POWER: { id: 'power', name: 'Power', price: { inr: 1499, usd: 18 }, actions: -1, features: ['Unlimited AI actions', 'Hosted Premium Models', 'Full integrations', '24/7 dedicated support'] },
} as const;

export const TOOL_LABELS: Record<string, string> = {
  get_calendar_events: '📅 Checking your calendar...',
  create_calendar_event: '📅 Creating event...',
  delete_calendar_event: '📅 Removing event...',
  get_availability: '📅 Checking availability...',
  search_emails: '📧 Searching Gmail...',
  count_emails: '📧 Counting emails...',
  delete_emails: '🗑️ Preparing to delete emails...',
  archive_emails: '📦 Archiving emails...',
  mark_emails_as_read: '✅ Marking as read...',
  draft_email_reply: '✍️ Drafting reply...',
};

export const SUPPORTED_AI_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq'] as const;

export const EXAMPLE_PROMPTS = [
  "What's on my calendar this week?",
  "Schedule a meeting with Rahul tomorrow at 10 AM",
  "Find all unread emails from LinkedIn",
  "Block 2 hours every morning for deep work",
  "What meetings do I have back-to-back today?",
  "Draft a polite decline for the 3 PM meeting request",
] as const;
