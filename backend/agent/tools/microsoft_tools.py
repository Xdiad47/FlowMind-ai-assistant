# backend/agent/tools/microsoft_tools.py
from datetime import date, datetime
from zoneinfo import ZoneInfo
from langchain_core.tools import tool
from backend.services import microsoft_calendar_service, outlook_service
from backend.agent.tools.base_tool import get_ms_access_token

IST = ZoneInfo("Asia/Kolkata")

def _fmt(value: str) -> str:
    try:
        if "T" not in value:
            return date.fromisoformat(value).strftime("%a, %d %b %Y")
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        dt = dt.astimezone(IST)
        return f"{dt.strftime('%a, %d %b %Y')} at {dt.strftime('%I:%M %p').lstrip('0')} IST"
    except Exception:
        return value


@tool
async def get_ms_calendar_events(start_date: str, end_date: str) -> str:
    """
    Get Microsoft Calendar (Outlook Calendar / Teams) events between two dates.
    Use this for questions about the user's Microsoft/work/Outlook calendar schedule.
    When user asks broadly about "my calendar this week", call BOTH get_calendar_events AND this tool.
    Args:
        start_date: ISO 8601 datetime e.g. '2026-05-05T00:00:00Z'
        end_date: ISO 8601 datetime e.g. '2026-05-12T23:59:59Z'
    Returns: formatted list of Microsoft Calendar events
    """
    token = get_ms_access_token()
    if not token:
        return "Microsoft Calendar is not connected. The user can connect it in Settings."

    events = await microsoft_calendar_service.get_events(token, start_date, end_date)
    if not events:
        return "No Microsoft Calendar events found in this date range."

    lines = []
    for e in events:
        attendee_str = f" ({len(e.attendees)} attendees)" if e.attendees else ""
        meet_str = f" 🎥 Teams: {e.meet_link}" if e.meet_link else ""
        lines.append(f"- [Outlook] {e.title}: {_fmt(e.start_time)} to {_fmt(e.end_time)}{attendee_str}{meet_str}")
    return "\n".join(lines)


@tool
async def search_outlook_emails(query: str) -> str:
    """
    Search Outlook (Microsoft) emails. Use when user asks about their Outlook/work emails.
    When user asks broadly about "my emails" or "my inbox", check BOTH Gmail and Outlook.
    Args:
        query: search string e.g. 'project update deadline' or 'from:boss@company.com'
    Returns: formatted Outlook email summaries
    """
    token = get_ms_access_token()
    if not token:
        return "Outlook is not connected. The user can connect it in Settings."

    messages = await outlook_service.search_messages(token, query, max_results=10)
    if not messages:
        return "No Outlook emails found matching that query."

    lines = []
    for m in messages:
        fc = m.get("from_contact", {})
        sender = fc.get("name") or fc.get("email", "Unknown")
        read_str = "" if m.get("is_read") else " (unread)"
        snippet = (m.get("snippet") or "")[:80]
        lines.append(f"- [Outlook] From {sender}: \"{m.get('subject', '(No Subject)')}\"{read_str} — {snippet}")
    return "\n".join(lines)


MICROSOFT_TOOLS = [get_ms_calendar_events, search_outlook_emails]
