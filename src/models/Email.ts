// src/models/Email.ts
export interface EmailContact {
  email: string;
  name: string | null;
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  from: EmailContact;
  to: EmailContact[];
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  source: 'gmail' | 'outlook';
  messageCount: number;
}

export interface EmailAction {
  type: 'delete' | 'archive' | 'label' | 'reply' | 'markRead';
  threadIds: string[];
  payload?: Record<string, unknown>;
}
