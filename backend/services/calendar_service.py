# backend/services/calendar_service.py
import uuid
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from backend.models.calendar import CalendarEvent, CreateEventRequest, Attendee, AttendeeResponse

def _get_calendar_service(access_token: str):
    credentials = Credentials(token=access_token)
    return build('calendar', 'v3', credentials=credentials)

async def get_events(access_token: str, start: str, end: str) -> list[CalendarEvent]:
    """Fetch events from ALL user-subscribed calendars (not just primary)."""
    service = _get_calendar_service(access_token)

    calendar_list = service.calendarList().list().execute()
    all_calendars = calendar_list.get('items', [])

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

async def delete_event(access_token: str, event_id: str) -> None:
    service = _get_calendar_service(access_token)
    service.events().delete(calendarId='primary', eventId=event_id).execute()

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
