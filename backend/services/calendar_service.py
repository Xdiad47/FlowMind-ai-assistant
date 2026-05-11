# backend/services/calendar_service.py
import uuid
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from backend.models.calendar import CalendarEvent, CreateEventRequest, Attendee, AttendeeResponse

def _get_calendar_service(access_token: str):
    credentials = Credentials(token=access_token)
    return build('calendar', 'v3', credentials=credentials)


def _normalize_text(value: str) -> str:
    return " ".join(value.lower().strip().split())


def _list_user_calendars(service) -> list[dict]:
    calendar_list = service.calendarList().list().execute()
    return calendar_list.get('items', [])

async def get_events(access_token: str, start: str, end: str) -> list[CalendarEvent]:
    """Fetch events from ALL user-subscribed calendars (not just primary)."""
    service = _get_calendar_service(access_token)

    all_calendars = _list_user_calendars(service)

    parsed_events = []

    for cal in all_calendars:
        cal_id = cal['id']
        cal_name = cal.get('summary', 'Unknown')
        try:
            events_result = service.events().list(
                calendarId=cal_id,
                timeMin=start,
                timeMax=end,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            for event in events_result.get('items', []):
                attendees = []
                for att in event.get('attendees', []):
                    attendees.append(Attendee(
                        email=att.get('email'),
                        name=att.get('displayName'),
                        response_status=AttendeeResponse(att.get('responseStatus', 'needsAction'))
                    ))

                parsed_events.append(CalendarEvent(
                    id=event.get('id'),
                    title=event.get('summary', 'No Title'),
                    description=event.get('description'),
                    start_time=event['start'].get('dateTime', event['start'].get('date')),
                    end_time=event['end'].get('dateTime', event['end'].get('date')),
                    location=event.get('location'),
                    attendees=attendees,
                    meet_link=event.get('hangoutLink'),
                    source=f"google:{cal_name}"
                ))
        except Exception:
            continue

    parsed_events.sort(key=lambda e: e.start_time)
    return parsed_events

async def create_event(access_token: str, request: CreateEventRequest) -> CalendarEvent:
    service = _get_calendar_service(access_token)

    event_body: dict = {
        'summary': request.title,
        'description': request.description,
        'start': {'dateTime': request.start_time, 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': request.end_time, 'timeZone': 'Asia/Kolkata'},
        'attendees': [{'email': email} for email in request.attendees],
    }

    if request.location:
        event_body['location'] = request.location

    # Add Google Meet conference link when requested
    if request.add_google_meet:
        event_body['conferenceData'] = {
            'createRequest': {
                'requestId': str(uuid.uuid4()),
                'conferenceSolutionKey': {'type': 'hangoutsMeet'}
            }
        }

    event = service.events().insert(
        calendarId='primary',
        body=event_body,
        conferenceDataVersion=1 if request.add_google_meet else 0,
        sendUpdates='all' if request.attendees else 'none'
    ).execute()

    return CalendarEvent(
        id=event.get('id'),
        title=event.get('summary'),
        description=event.get('description'),
        start_time=event['start'].get('dateTime', event['start'].get('date')),
        end_time=event['end'].get('dateTime', event['end'].get('date')),
        location=event.get('location'),
        meet_link=event.get('hangoutLink')
    )

def _delete_event_by_id_across_calendars(service, event_id: str) -> dict | None:
    """Delete a calendar event by ID by searching all user calendars."""
    for cal in _list_user_calendars(service):
        cal_id = cal.get('id')
        cal_name = cal.get('summary', 'Unknown')
        if not cal_id:
            continue
        try:
            event = service.events().get(calendarId=cal_id, eventId=event_id).execute()
            service.events().delete(calendarId=cal_id, eventId=event_id).execute()
            return {
                "id": event_id,
                "title": event.get('summary', 'Untitled event'),
                "calendar_name": cal_name,
            }
        except HttpError as e:
            if getattr(e.resp, "status", None) == 404:
                continue
            continue
        except Exception:
            continue
    return None


def _find_title_matches(service, event_title: str) -> list[dict]:
    """Find likely event matches by title in a broad 1-year window."""
    title_norm = _normalize_text(event_title)
    if not title_norm:
        return []

    time_min = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat().replace("+00:00", "Z")
    time_max = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat().replace("+00:00", "Z")
    matches: list[dict] = []

    for cal in _list_user_calendars(service):
        cal_id = cal.get('id')
        cal_name = cal.get('summary', 'Unknown')
        if not cal_id:
            continue
        try:
            events_result = service.events().list(
                calendarId=cal_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
        except Exception:
            continue

        for event in events_result.get('items', []):
            summary = event.get('summary', '')
            summary_norm = _normalize_text(summary)
            if not summary_norm:
                continue
            if title_norm == summary_norm or title_norm in summary_norm or summary_norm in title_norm:
                matches.append({
                    "id": event.get('id'),
                    "title": summary,
                    "calendar_id": cal_id,
                    "calendar_name": cal_name,
                })

    return matches


async def delete_event(access_token: str, event_id: str, event_title: str | None = None) -> dict:
    service = _get_calendar_service(access_token)

    # Try direct ID-based deletion first.
    if event_id:
        deleted = _delete_event_by_id_across_calendars(service, event_id)
        if deleted:
            return deleted

    # Fallback: if model passed a bad/placeholder ID, resolve via title.
    if event_title:
        matches = _find_title_matches(service, event_title)
        unique_by_id: dict[str, dict] = {}
        for m in matches:
            mid = m.get("id")
            if mid:
                unique_by_id[mid] = m
        deduped = list(unique_by_id.values())

        if len(deduped) == 1:
            match = deduped[0]
            service.events().delete(calendarId=match["calendar_id"], eventId=match["id"]).execute()
            return {
                "id": match["id"],
                "title": match["title"],
                "calendar_name": match["calendar_name"],
            }

        if len(deduped) > 1:
            titles = ", ".join(f"'{m['title']}'" for m in deduped[:3])
            raise ValueError(
                f"I found multiple matching events ({titles}). Please specify the exact event title and time before deleting."
            )

    raise ValueError("I couldn't find that event to delete. Please run get_calendar_events first and use the exact event ID.")

async def get_availability(access_token: str, start: str, end: str) -> list[dict]:
    """Returns busy time slots from freebusy query."""
    service = _get_calendar_service(access_token)
    body = {
        "timeMin": start,
        "timeMax": end,
        "items": [{"id": "primary"}]
    }

    events_result = service.freebusy().query(body=body).execute()
    busy_slots = events_result.get('calendars', {}).get('primary', {}).get('busy', [])
    return busy_slots
