# backend/services/briefing_service.py
import asyncio
import json
import logging
from datetime import datetime, timezone

from backend.config.settings import settings
from backend.models.briefing import CalendarEventBrief, DailyBriefing, EmailHighlight
from backend.models.user import UserProfile
from backend.services import calendar_service, gmail_service, outlook_service
from backend.services.microsoft_calendar_service import get_events as get_ms_events

logger = logging.getLogger(__name__)


async def _safe_gmail(token: str | None) -> list:
    if not token:
        return []
    try:
        return await gmail_service.search_threads(token, "is:unread newer_than:3d category:primary", 20)
    except Exception as e:
        logger.warning(f"Gmail briefing fetch failed: {e}")
        return []


async def _safe_outlook(token: str | None) -> list:
    if not token:
        return []
    try:
        return await outlook_service.get_inbox_messages(token, 30)
    except Exception as e:
        logger.warning(f"Outlook briefing fetch failed: {e}")
        return []


async def _safe_google_calendar(token: str | None, start: str, end: str) -> list:
    if not token:
        return []
    try:
        return await calendar_service.get_events(token, start, end)
    except Exception as e:
        logger.warning(f"Google Calendar briefing fetch failed: {e}")
        return []


async def _safe_ms_calendar(token: str | None, start: str, end: str) -> list:
    if not token:
        return []
    try:
        return await get_ms_events(token, start, end)
    except Exception as e:
        logger.warning(f"Microsoft Calendar briefing fetch failed: {e}")
        return []


async def _generate_ai_summaries(
    gmail_threads: list,
    outlook_msgs: list,
    google_events: list,
    ms_events: list,
) -> tuple[str, list[dict]]:
    """Single Groq call — returns (overall_summary, [{id, summary}, ...])."""
    total_emails = len(gmail_threads) + len(outlook_msgs)
    total_events = len(google_events) + len(ms_events)
    fallback_summary = (
        f"You have {total_emails} unread email{'s' if total_emails != 1 else ''} "
        f"and {total_events} event{'s' if total_events != 1 else ''} today."
    )

    if not settings.platform_groq_api_key:
        return fallback_summary, []

    # Take only the 5 most recent from each source (both APIs return newest-first)
    email_lines: list[str] = []
    for t in gmail_threads[:5]:
        name = t.from_contact.name or t.from_contact.email
        email_lines.append(
            f"[gmail:{t.id}] From: {name} | Subject: {t.subject} | Preview: {t.snippet[:120]}"
        )
    for m in outlook_msgs[:5]:
        fc = m.get("from_contact", {})
        name = fc.get("name") or fc.get("email", "Unknown")
        email_lines.append(
            f"[outlook:{m['id']}] From: {name} | Subject: {m['subject']} | Preview: {m.get('snippet', '')[:120]}"
        )

    event_lines: list[str] = []
    for e in google_events:
        event_lines.append(f"[google] {e.title} at {e.start_time}")
    for e in ms_events:
        event_lines.append(f"[microsoft] {e.title} at {e.start_time}")

    context_parts: list[str] = []
    if email_lines:
        context_parts.append("UNREAD EMAILS:\n" + "\n".join(email_lines))
    if event_lines:
        context_parts.append("TODAY'S CALENDAR EVENTS:\n" + "\n".join(event_lines))

    if not context_parts:
        return "Nothing on your plate today. Enjoy the quiet!", []

    prompt = f"""You are summarizing a professional's day. Be concise and helpful.

{chr(10).join(context_parts)}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "overall_summary": "1-2 sentence summary mentioning key highlights",
  "highlights": [
    {{"id": "source:id_here", "summary": "short actionable phrase under 12 words"}}
  ]
}}

Rules:
- overall_summary: mention email count and event count, highlight the most important items
- highlights: generate one highlight for EVERY email listed above (all Gmail AND all Outlook)
- Each summary should capture the key point (e.g. "Arun pinged you on Figma", "Tax deducted today")
- id must exactly match the [source:id] prefix shown above (e.g. "gmail:abc123")
- Return only JSON, nothing else"""

    try:
        from langchain_groq import ChatGroq

        llm = ChatGroq(
            api_key=settings.platform_groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=0,
        )
        response = await llm.ainvoke(prompt)
        text = response.content.strip()

        if "```" in text:
            for part in text.split("```"):
                if "{" in part:
                    text = part.lstrip("json").strip()
                    break

        result = json.loads(text)
        return result.get("overall_summary", fallback_summary), result.get("highlights", [])
    except Exception as e:
        logger.warning(f"Groq briefing generation failed: {e}")
        return fallback_summary, []


async def generate_daily_briefing(
    user: UserProfile,
    google_token: str | None,
    ms_token: str | None,
) -> DailyBriefing:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=0)
    start_str = today_start.isoformat().replace("+00:00", "Z")
    end_str = today_end.isoformat().replace("+00:00", "Z")

    gmail_token = google_token if user.integrations.gmail else None
    gcal_token = google_token if user.integrations.google_calendar else None
    outlook_token = ms_token if user.integrations.outlook_mail else None
    mscal_token = ms_token if user.integrations.microsoft_calendar else None

    gmail_threads, outlook_msgs, google_events, ms_events = await asyncio.gather(
        _safe_gmail(gmail_token),
        _safe_outlook(outlook_token),
        _safe_google_calendar(gcal_token, start_str, end_str),
        _safe_ms_calendar(mscal_token, start_str, end_str),
    )

    # Filter Outlook to last 3 days — matches Gmail's newer_than:3d window
    from datetime import timedelta
    today_str = now.strftime("%Y-%m-%d")
    three_days_ago_str = (now - timedelta(days=3)).strftime("%Y-%m-%d")
    outlook_today = [m for m in outlook_msgs if m.get("date", "") >= three_days_ago_str]
    if not outlook_today:
        outlook_today = outlook_msgs  # fallback: use all fetched if nothing in 3 days

    google_event_briefs = [
        CalendarEventBrief(
            id=e.id,
            title=e.title,
            start_time=e.start_time,
            end_time=e.end_time,
            location=e.location,
            meet_link=e.meet_link,
            attendee_count=len(e.attendees),
            source="google",
        )
        for e in google_events
    ]

    ms_event_briefs = [
        CalendarEventBrief(
            id=e.id,
            title=e.title,
            start_time=e.start_time,
            end_time=e.end_time,
            location=e.location,
            meet_link=e.meet_link,
            attendee_count=len(e.attendees),
            source="microsoft",
        )
        for e in ms_events
    ]

    overall_summary, ai_highlights = await _generate_ai_summaries(
        gmail_threads, outlook_today, google_events, ms_events
    )

    # Build lookup map for turning AI highlight IDs back into full email data
    email_map: dict[str, dict] = {}
    for t in gmail_threads:
        email_map[f"gmail:{t.id}"] = {
            "thread_id": t.id,
            "subject": t.subject,
            "from_name": t.from_contact.name or t.from_contact.email,
            "from_email": t.from_contact.email,
            "snippet": t.snippet,
            "source": "gmail",
        }
    for m in outlook_today:
        fc = m.get("from_contact", {})
        email_map[f"outlook:{m['id']}"] = {
            "thread_id": m["id"],
            "subject": m["subject"],
            "from_name": fc.get("name") or fc.get("email", "Unknown"),
            "from_email": fc.get("email", ""),
            "snippet": m.get("snippet", ""),
            "source": "outlook",
        }

    email_highlights = []
    for h in ai_highlights:
        key = h.get("id", "")
        if key in email_map:
            data = email_map[key]
            email_highlights.append(
                EmailHighlight(
                    thread_id=data["thread_id"],
                    subject=data["subject"],
                    from_name=data["from_name"],
                    from_email=data["from_email"],
                    snippet=data["snippet"],
                    ai_summary=h.get("summary", ""),
                    source=data["source"],
                )
            )

    hour = now.hour
    greeting_word = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
    first_name = user.name.split()[0] if user.name else user.email.split("@")[0]

    return DailyBriefing(
        date=today_str,
        greeting=f"{greeting_word}, {first_name}",
        overall_summary=overall_summary,
        gmail_count=len(gmail_threads),
        outlook_count=len(outlook_today),
        google_events=google_event_briefs,
        microsoft_events=ms_event_briefs,
        email_highlights=email_highlights,
        has_gmail=user.integrations.gmail,
        has_outlook=user.integrations.outlook_mail,
        has_google_calendar=user.integrations.google_calendar,
        has_microsoft_calendar=user.integrations.microsoft_calendar,
    )
