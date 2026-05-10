# backend/agent/tools/calendar_tools.py
from langchain_core.tools import tool
from backend.services import calendar_service
from backend.agent.tools.base_tool import get_access_token, get_permissions

@tool
def get_calendar_events(start_date: str, end_date: str) -> str:
    """
    Get calendar events between two dates.
    Use this when the user asks about their schedule, meetings, or events.
    Args:
        start_date: ISO 8601 date string e.g. '2026-05-05T00:00:00Z'
        end_date: ISO 8601 date string e.g. '2026-05-12T00:00:00Z'
    Returns: formatted string listing events with time, title, attendees
    """
    import asyncio
    token = get_access_token()
    events = asyncio.run(calendar_service.get_events(token, start_date, end_date))
    if not events:
        return "No events found in this date range."
    
    lines = []
    for e in events:
        attendee_str = f" ({len(e.attendees)} attendees)" if e.attendees else ""
        lines.append(f"- {e.start_time} to {e.end_time}: {e.title}{attendee_str}")
    return "\n".join(lines)

@tool
def create_calendar_event(
    title: str,
    start_time: str,
    end_time: str,
    attendee_emails: str = "",
    description: str = "",
    location: str = ""
) -> str:
    """
    Create a new calendar event.
    Use when the user asks to schedule, book, or create a meeting/event.
    Args:
        title: Event title e.g. 'Meeting with Rahul'
        start_time: ISO 8601 datetime e.g. '2026-05-06T09:00:00Z'
        end_time: ISO 8601 datetime e.g. '2026-05-06T10:00:00Z'
        attendee_emails: comma-separated emails e.g. 'rahul@gmail.com,priya@gmail.com'
        description: optional event description
        location: optional location or meeting link
    Returns: confirmation with event details
    """
    import asyncio
    from backend.models.calendar import CreateEventRequest
    
    permissions = get_permissions()
    if not permissions.get('can_create_events', True):
        return "Permission denied: Calendar event creation is disabled. User can enable it in Settings > Permissions."
        
    token = get_access_token()
    attendees = [e.strip() for e in attendee_emails.split(',') if e.strip()]
    
    req = CreateEventRequest(
        title=title, start_time=start_time, end_time=end_time,
        attendees=attendees, description=description, location=location
    )
    
    event = asyncio.run(calendar_service.create_event(token, req))
    return f"✅ Created event '{event.title}' on {event.start_time}. Event ID: {event.id}"

@tool
def delete_calendar_event(event_id: str, event_title: str) -> str:
    """
    Delete a calendar event by ID.
    IMPORTANT: Only use this after getting explicit user confirmation.
    Always show the event details and ask for confirmation before calling this tool.
    Args:
        event_id: The calendar event ID from get_calendar_events
        event_title: Human-readable title for confirmation message
    Returns: confirmation of deletion
    """
    import asyncio
    permissions = get_permissions()
    if not permissions.get('can_delete_events', False):
        return "Permission denied: Calendar event deletion is disabled. User can enable it in Settings > Permissions."
        
    token = get_access_token()
    asyncio.run(calendar_service.delete_event(token, event_id))
    return f"✅ Deleted event '{event_title}'."

@tool
def get_availability(start_date: str, end_date: str) -> str:
    """
    Check free/busy availability in a date range.
    Use when user asks about free time, wants to find a slot, or asks if they're free.
    Args:
        start_date: ISO 8601 date string
        end_date: ISO 8601 date string
    Returns: formatted list of free and busy time slots
    """
    import asyncio
    token = get_access_token()
    slots = asyncio.run(calendar_service.get_availability(token, start_date, end_date))
    free = [s for s in slots if s.get('available')]
    busy = [s for s in slots if not s.get('available')]
    return f"Free slots: {len(free)}\nBusy slots: {len(busy)}\nDetails: {slots[:10]}"

# Export all calendar tools as a list
CALENDAR_TOOLS = [get_calendar_events, create_calendar_event, delete_calendar_event, get_availability]
