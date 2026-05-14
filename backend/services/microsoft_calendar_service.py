# backend/services/microsoft_calendar_service.py
import httpx
from backend.models.calendar import CalendarEvent, Attendee, AttendeeResponse

GRAPH_BASE = "https://graph.microsoft.com/v1.0"

_RESPONSE_MAP = {
    "accepted": AttendeeResponse.ACCEPTED,
    "declined": AttendeeResponse.DECLINED,
    "tentativelyAccepted": AttendeeResponse.TENTATIVE,
    "none": AttendeeResponse.NEEDS_ACTION,
}

def _fix_dt(dt: str) -> str:
    if dt and "T" in dt and "Z" not in dt and "+" not in dt[10:]:
        return dt + "Z"
    return dt

async def get_events(access_token: str, start: str, end: str) -> list[CalendarEvent]:
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    params = {
        "startDateTime": start,
        "endDateTime": end,
        "$select": "id,subject,start,end,location,attendees,isAllDay,type,recurrence,onlineMeeting,bodyPreview",
        "$orderby": "start/dateTime",
        "$top": 100,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{GRAPH_BASE}/me/calendarView", headers=headers, params=params)

    if resp.status_code != 200:
        raise Exception(f"Microsoft Graph calendar error {resp.status_code}: {resp.text}")

    events = []
    for item in resp.json().get("value", []):
        attendees = []
        for att in item.get("attendees", []):
            ea = att.get("emailAddress", {})
            response = att.get("status", {}).get("response", "none")
            attendees.append(Attendee(
                email=ea.get("address", ""),
                name=ea.get("name"),
                response_status=_RESPONSE_MAP.get(response, AttendeeResponse.NEEDS_ACTION),
            ))

        om = item.get("onlineMeeting") or {}
        events.append(CalendarEvent(
            id=item.get("id", ""),
            title=item.get("subject", "No Title"),
            description=item.get("bodyPreview"),
            start_time=_fix_dt(item["start"]["dateTime"]),
            end_time=_fix_dt(item["end"]["dateTime"]),
            location=(item.get("location") or {}).get("displayName"),
            attendees=attendees,
            is_recurring=item.get("type", "singleInstance") != "singleInstance",
            meet_link=om.get("joinUrl"),
            source="microsoft",
        ))

    return events
