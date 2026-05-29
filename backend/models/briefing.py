# backend/models/briefing.py
from pydantic import BaseModel


class EmailHighlight(BaseModel):
    thread_id: str
    subject: str
    from_name: str
    from_email: str
    snippet: str
    ai_summary: str
    source: str  # "gmail" or "outlook"


class CalendarEventBrief(BaseModel):
    id: str
    title: str
    start_time: str
    end_time: str
    location: str | None = None
    meet_link: str | None = None
    attendee_count: int = 0
    source: str  # "google" or "microsoft"


class DailyBriefing(BaseModel):
    date: str
    greeting: str
    overall_summary: str
    gmail_count: int = 0
    outlook_count: int = 0
    google_events: list[CalendarEventBrief] = []
    microsoft_events: list[CalendarEventBrief] = []
    email_highlights: list[EmailHighlight] = []
    has_gmail: bool = False
    has_outlook: bool = False
    has_google_calendar: bool = False
    has_microsoft_calendar: bool = False
