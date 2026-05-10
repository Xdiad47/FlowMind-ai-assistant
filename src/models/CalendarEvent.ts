// src/models/CalendarEvent.ts
export interface Attendee {
  email: string;
  name: string | null;
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;       // ISO 8601
  endTime: string;         // ISO 8601
  location: string | null;
  attendees: Attendee[];
  isRecurring: boolean;
  source: 'google' | 'microsoft';
  meetLink: string | null;
  color: string | null;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
