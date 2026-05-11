# backend/agent/tools/calendar_tools.py
from typing import Any
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

@tool
async def get_calendar_events(start_date: str, end_date: str) -> str:
    """
    Get calendar events between two dates.
    Use this when the user asks about their schedule, meetings, or events.
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
        lines.append(f"- [{e.id}] {e.start_time} to {e.end_time}: {e.title}{attendee_str}{meet_str}")
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
    IMPORTANT: If the user mentions a person by first name only, ask for their email first.
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

    # Some model tool calls send booleans as strings ("true"/"false").
    if isinstance(add_google_meet, str):
        add_google_meet = add_google_meet.strip().lower() in {"true", "1", "yes", "y"}

    req = CreateEventRequest(
        title=title, start_time=start_time, end_time=end_time,
        attendees=attendees, description=description, location=location,
        add_google_meet=add_google_meet
    )

    event = await calendar_service.create_event(token, req)
    meet_info = f"\n🎥 Google Meet: {event.meet_link}" if event.meet_link else ""
    return f"✅ Created '{event.title}' on {event.start_time}.{meet_info}\nEvent ID: {event.id}"

@tool
async def delete_calendar_event(event_id: str, event_title: str, confirmed: bool = False) -> str:
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

    if not confirmed:
        return f"NEEDS_CONFIRMATION: About to delete '{event_title}' (ID: {event_id}). Please confirm with the user before proceeding."

    token = get_access_token()
    await calendar_service.delete_event(token, event_id)
    return f"✅ Deleted event '{event_title}'."

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
