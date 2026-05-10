# backend/routers/calendar.py
from fastapi import APIRouter, Depends, HTTPException, Request
from backend.models.calendar import CreateEventRequest
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user, require_integration
from backend.services import token_service, calendar_service
from backend.routers.gmail import log_action

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/events")
async def get_events(
    request: Request,
    start: str, end: str,
    user: UserProfile = Depends(require_integration('google_calendar'))
):
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    events = await calendar_service.get_events(access_token, start, end)
    return {"success": True, "data": [e.model_dump(by_alias=True) for e in events]}

@router.post("/events")
async def create_event(
    request: Request,
    body: CreateEventRequest,
    user: UserProfile = Depends(require_integration('google_calendar'))
):
    if not user.permissions.can_create_events:
        raise HTTPException(status_code=403, detail="Event creation not permitted. Enable in Settings > Permissions.")
        
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    event = await calendar_service.create_event(access_token, body)
    await log_action(user.id, "calendar", "create_event", f"Created event: {event.title}", True)
    return {"success": True, "data": event.model_dump(by_alias=True)}

@router.delete("/events/{event_id}")
async def delete_event(
    request: Request,
    event_id: str,
    user: UserProfile = Depends(require_integration('google_calendar'))
):
    if not user.permissions.can_delete_events:
        raise HTTPException(status_code=403, detail="Event deletion not permitted. Enable in Settings > Permissions.")
        
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    await calendar_service.delete_event(access_token, event_id)
    await log_action(user.id, "calendar", "delete_event", f"Deleted event ID: {event_id}", False)
    return {"success": True, "data": None}

@router.get("/availability")
async def get_availability(
    request: Request,
    start: str, end: str,
    user: UserProfile = Depends(require_integration('google_calendar'))
):
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    slots = await calendar_service.get_availability(access_token, start, end)
    return {"success": True, "data": slots}

