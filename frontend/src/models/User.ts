// src/models/User.ts
export interface UserPermissions {
  canDeleteEmails: boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canReplyEmails: boolean;
  canSendEmails: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  plan: 'free' | 'pro_byok' | 'pro_hosted' | 'power';
  apiProvider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'hosted' | null;
  integrations: {
    googleCalendar: boolean;
    gmail: boolean;
    microsoftCalendar: boolean;
    outlookMail: boolean;
  };
  permissions: UserPermissions;
  briefingHour: number;
  timezone: string;
  createdAt: string;
}
