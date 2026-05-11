# backend/agent/tools/calendar_tools.py
from typing import Any
from datetime import date, datetime
from zoneinfo import ZoneInfo
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from backend.services import calendar_service
from backend.agent.tools.base_tool import get_access_token, get_permissions

class CreateCalendarEventInput(BaseModel):
    title: str = Field(description="Event title e.g. 'Meeting with Rahul'")
    start_time: str = Field(description="ISO 8601 datetime e.g. '2026-05-06T09:00:00+05:30'")
    end_time: str = Field(description="ISO 8601 datetime e.g. '2026-05-06T10:00:00+05:30'")
    attendee_emails: str = Field(default="", description="comma-separated emails e.g. 'rahul@gmail.com,priya@gmail.com'")
    description: str = Field(default="", description="optional event description")
    location: str = Field(default="", description="optional location or meeting link")
    add_google_meet: Any = Field(default=True, description="whether to add a Google Meet link")

class DeleteCalendarEventInput(BaseModel):
    event_id: str = Field(default="", description="The calendar event ID from get_calendar_events. Leave blank if unknown.")
    event_title: str = Field(description="Human-readable title for confirmation message")
    confirmed: Any = Field(default=False, description="Set true only after explicit user confirmation")


IST = ZoneInfo("Asia/Kolkata")


def _format_calendar_time(value: str) -> str:
    """Convert ISO strings into human-friendly IST date/time text."""
    try:
        if "T" not in value:
            d = date.fromisoformat(value)
            return d.strftime("%a, %d %b %Y")

        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        dt = dt.astimezone(IST)
        return f"{dt.strftime('%a, %d %b %Y')} at {dt.strftime('%I:%M %p').lstrip('0')} IST"
    except Exception:
        return value

@tool
async def get_calendar_events(start_date: str, end_date: str) -> str:
    """
    Get calendar events between two dates.
    Use this when the user asks about their schedule, meetings, or events.
    If user did not specify a year, use the current IST year by default.
    Args:
        start_date: ISO 8601 date string e.g. '2026-05-05T00:00:00Z'
        end_date: ISO 8601 date string e.g. '2026-05-12T00:00:00Z'
    Returns: formatted string listing events with time, title, attendees, meet link
    """
    token = get_access_token()
    events = await calendar_service.get_events(token, start_date, end_date)
    if not events:
        return "No events found in this date range."

    lines = []
    for e in events:
        attendee_str = f" ({len(e.attendees)} attendees)" if e.attendees else ""
        meet_str = f" 🎥 {e.meet_link}" if e.meet_link else ""
        start_fmt = _format_calendar_time(e.start_time)
        end_fmt = _format_calendar_time(e.end_time)
        lines.append(f"- {e.title}: {start_fmt} to {end_fmt}{attendee_str}{meet_str}")
    return "\n".join(lines)

@tool(args_schema=CreateCalendarEventInput)
async def create_calendar_event(
    title: str,
    start_time: str,
    end_time: str,
    attendee_emails: str = "",
    description: str = "",
    location: str = "",
    add_google_meet: Any = True
) -> str:
    """
    Create a new calendar event, optionally with a Google Meet link.
    Use when the user asks to schedule, book, or create a meeting/event.
    IMPORTANT:
    - Ask for attendee email only when user explicitly requests a meeting/Meet/call/invite.
    - For normal events/reminders (including "event with <name>"), do not require attendee email and do not add Google Meet.
    Args:
        title: Event title e.g. 'Meeting with Rahul'
        start_time: ISO 8601 datetime e.g. '2026-05-06T09:00:00+05:30'
        end_time: ISO 8601 datetime e.g. '2026-05-06T10:00:00+05:30'
        attendee_emails: comma-separated emails e.g. 'rahul@gmail.com,priya@gmail.com'
        description: optional event description
        location: optional location or meeting link
        add_google_meet: whether to add a Google Meet link (default True for meetings with attendees)
    Returns: confirmation with event details and meet link if created
    """
    from backend.models.calendar import CreateEventRequest

    permissions = get_permissions()
    if not permissions.get('can_create_events', True):
        return "Permission denied: Calendar event creation is disabled. User can enable it in Settings > Permissions."

    token = get_access_token()
    attendees = [e.strip() for e in attendee_emails.split(',') if e.strip()]
    intent_text = f"{title} {description}".lower()
    meeting_keywords = ("meeting", "meet with", "google meet", "video call", "call with")
    event_keywords = ("event", "reminder")
    is_meeting_intent = any(keyword in intent_text for keyword in meeting_keywords)
    is_event_intent = any(keyword in intent_text for keyword in event_keywords)

    # Some model tool calls send booleans as strings ("true"/"false").
    if isinstance(add_google_meet, str):
        add_google_meet = add_google_meet.strip().lower() in {"true", "1", "yes", "y"}

    # For meetings, require at least one attendee email before creating a Meet event.
    if is_meeting_intent and not attendees:
        return "Please share at least one attendee email ID to set up this meeting with Google Meet."

    # Event/reminder intent should never create a Meet link unless user explicitly asked for a meeting.
    if is_event_intent and not is_meeting_intent:
        add_google_meet = False

    # Any non-meeting intent should default to no Meet link.
    if not is_meeting_intent:
        add_google_meet = False

    req = CreateEventRequest(
        title=title, start_time=start_time, end_time=end_time,
        attendees=attendees, description=description, location=location,
        add_google_meet=add_google_meet
    )

    event = await calendar_service.create_event(token, req)
    meet_info = f"\n🎥 Google Meet: {event.meet_link}" if event.meet_link else ""
    start_fmt = _format_calendar_time(event.start_time)
    end_fmt = _format_calendar_time(event.end_time)
    return f"✅ Created '{event.title}' from {start_fmt} to {end_fmt}.{meet_info}\nEvent ID: {event.id}"

@tool(args_schema=DeleteCalendarEventInput)
async def delete_calendar_event(event_id: str = "", event_title: str = "", confirmed: bool = False) -> str:
    """
    Delete a calendar event by ID.
    SAFETY: If confirmed=False, returns a confirmation request — DO NOT delete yet.
    Always call get_calendar_events first to show the user what will be deleted.
    Only call with confirmed=True after the user explicitly confirms.
    Args:
        event_id: The calendar event ID from get_calendar_events
        event_title: Human-readable title for confirmation message
        confirmed: Must be True — only set after user explicitly confirms deletion
    Returns: confirmation request (if not confirmed) or deletion confirmation
    """
    permissions = get_permissions()
    if not permissions.get('can_delete_events', False):
        return "Permission denied: Calendar event deletion is disabled. User can enable it in Settings > Permissions."

    # Some model tool calls send booleans as strings ("true"/"false"/"yes").
    if isinstance(confirmed, str):
        confirmed = confirmed.strip().lower() in {"true", "1", "yes", "y"}

    if not confirmed:
        return f"NEEDS_CONFIRMATION: About to delete '{event_title}' (ID: {event_id}). Please confirm with the user before proceeding."

    token = get_access_token()
    # Placeholder IDs are not real event IDs; treat them as unknown.
    cleaned_event_id = event_id.strip()
    if cleaned_event_id.lower().startswith("event_id_"):
        cleaned_event_id = ""

    try:
        deleted = await calendar_service.delete_event(
            token,
            cleaned_event_id,
            event_title=event_title
        )
    except ValueError as e:
        return str(e)
    except Exception:
        return "I couldn't delete that event right now. Please fetch events again and confirm the exact event ID."

    deleted_title = deleted.get("title") if isinstance(deleted, dict) else event_title
    return f"✅ Deleted event '{deleted_title}'."

@tool
async def get_availability(start_date: str, end_date: str) -> str:
    """
    Check free/busy availability in a date range.
    Use when user asks about free time, wants to find a slot, or asks if they're free.
    Args:
        start_date: ISO 8601 datetime string
        end_date: ISO 8601 datetime string
    Returns: formatted list of busy periods and suggested free slots
    """
    token = get_access_token()
    busy_slots = await calendar_service.get_availability(token, start_date, end_date)

    if not busy_slots:
        return f"You are completely free between {start_date} and {end_date}. No busy periods found."

    lines = [f"Busy periods ({len(busy_slots)} total):"]
    for slot in busy_slots:
        lines.append(f"  - {slot.get('start', '')} → {slot.get('end', '')}")

    lines.append(f"\nFree slots available: {max(0, 8 - len(busy_slots))} (approx, during business hours)")
    return "\n".join(lines)

# Export all calendar tools as a list
CALENDAR_TOOLS = [get_calendar_events, create_calendar_event, delete_calendar_event, get_availability]
