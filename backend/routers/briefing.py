# backend/routers/briefing.py
from fastapi import APIRouter, Depends, Request

from backend.middleware.auth_middleware import get_current_user
from backend.models.user import UserProfile
from backend.services import briefing_service, token_service

router = APIRouter(prefix="/briefing", tags=["briefing"])


@router.get("/today")
async def get_today_briefing(
    request: Request,
    user: UserProfile = Depends(get_current_user),
):
    forwarded_token = request.headers.get("x-google-access-token")

    google_token = None
    if user.integrations.gmail or user.integrations.google_calendar:
        google_token = await token_service.get_valid_google_token(user.id, forwarded_token)

    ms_token = None
    if user.integrations.outlook_mail or user.integrations.microsoft_calendar:
        ms_token = await token_service.get_valid_microsoft_token(user.id)

    briefing = await briefing_service.generate_daily_briefing(user, google_token, ms_token)
    return {"success": True, "data": briefing.model_dump()}
