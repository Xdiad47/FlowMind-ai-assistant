// src/models/Briefing.ts

export interface EmailHighlight {
  threadId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  aiSummary: string;
  source: 'gmail' | 'outlook';
}

export interface CalendarEventBrief {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  meetLink: string | null;
  attendeeCount: number;
  source: 'google' | 'microsoft';
}

export interface DailyBriefing {
  date: string;
  greeting: string;
  overallSummary: string;
  gmailCount: number;
  outlookCount: number;
  googleEvents: CalendarEventBrief[];
  microsoftEvents: CalendarEventBrief[];
  emailHighlights: EmailHighlight[];
  hasGmail: boolean;
  hasOutlook: boolean;
  hasGoogleCalendar: boolean;
  hasMicrosoftCalendar: boolean;
}
