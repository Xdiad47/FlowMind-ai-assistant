# backend/routers/chat.py
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from backend.models.chat import ChatRequest
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user
from backend.middleware.rate_limiter import limiter
from backend.services import auth_service, token_service
from backend.agent.runner import run_agent
from backend.services.token_service import get_valid_google_token
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/stream")
@limiter.limit("30/minute")
async def stream_chat(
    request: Request,
    body: ChatRequest,
    user: UserProfile = Depends(get_current_user)
):
    # Check action limit
    allowed = await auth_service.check_action_limit(user.id, user.plan.value)
    if not allowed:
        async def limit_exceeded():
            yield json.dumps({"type": "error", "content": "Monthly action limit reached. Upgrade to Pro for unlimited actions."})
        return EventSourceResponse(limit_exceeded())

    # Get valid Google token (prefer forwarded token from proxy)
    try:
        forwarded_token = request.headers.get("x-google-access-token")
        access_token = await get_valid_google_token(user.id, forwarded_token)
    except Exception:
        access_token = ""

    # Get Microsoft token if connected
    try:
        ms_access_token = await token_service.get_valid_microsoft_token(user.id) if user.integrations.microsoft_calendar else ""
    except Exception:
        ms_access_token = ""

    # Permissions as dict
    permissions = user.permissions.model_dump()

    from backend.agent.runner import fetch_history
    conversation_history = await fetch_history(user.id, body.conversation_id)

    async def generate():
        async for event_dict in run_agent(
            message=body.message,
            user_id=user.id,
            conversation_id=body.conversation_id,
            access_token=access_token,
            permissions=permissions,
            plan=user.plan.value,
            conversation_history=conversation_history,
            ms_access_token=ms_access_token,
        ):
            yield json.dumps(event_dict)

    return EventSourceResponse(generate())

@router.post("/confirm")
async def confirm_action(
    body: dict,
    user: UserProfile = Depends(get_current_user)
):
    return {"success": True}
