# backend/routers/outlook.py
from fastapi import APIRouter, Depends, Query
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user
from backend.services import token_service, outlook_service

router = APIRouter(prefix="/outlook", tags=["outlook"])

@router.get("/messages")
async def get_outlook_messages(
    max: int = Query(default=30, le=100),
    user: UserProfile = Depends(get_current_user),
):
    if not user.integrations.outlook_mail:
        return {"success": False, "error": {"code": "NOT_CONNECTED", "message": "Outlook not connected. Connect it in Settings."}}
    access_token = await token_service.get_valid_microsoft_token(user.id)
    messages = await outlook_service.get_inbox_messages(access_token, max)
    return {"success": True, "data": messages}

@router.get("/search")
async def search_outlook(
    q: str = Query(...),
    max: int = Query(default=30, le=100),
    user: UserProfile = Depends(get_current_user),
):
    if not user.integrations.outlook_mail:
        return {"success": False, "error": {"code": "NOT_CONNECTED", "message": "Outlook not connected. Connect it in Settings."}}
    access_token = await token_service.get_valid_microsoft_token(user.id)
    messages = await outlook_service.search_messages(access_token, q, max)
    return {"success": True, "data": messages}
