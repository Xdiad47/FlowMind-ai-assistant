# backend/routers/auth.py
import json
import base64
import logging
import urllib.parse
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from backend.config.settings import settings
import firebase_admin.firestore

router = APIRouter(prefix="/auth", tags=["auth"])

MICROSOFT_SCOPES = (
    "openid email profile User.Read "
    "Mail.Read Mail.ReadWrite "
    "Calendars.Read Calendars.ReadWrite "
    "offline_access"
)

def _ms_auth_url() -> str:
    return f"https://login.microsoftonline.com/{settings.azure_ad_tenant_id}/oauth2/v2.0/authorize"

def _ms_token_url() -> str:
    return f"https://login.microsoftonline.com/{settings.azure_ad_tenant_id}/oauth2/v2.0/token"


@router.get("/microsoft/login")
async def microsoft_login(user_id: str = Query(...)):
    state = base64.urlsafe_b64encode(json.dumps({"user_id": user_id}).encode()).decode()
    params = {
        "client_id": settings.azure_ad_client_id,
        "response_type": "code",
        "redirect_uri": settings.microsoft_redirect_uri,
        "scope": MICROSOFT_SCOPES,
        "state": state,
        "response_mode": "query",
        "prompt": "select_account",
    }
    full_url = f"{_ms_auth_url()}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=full_url)


@router.get("/microsoft/callback")
async def microsoft_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
):
    frontend_base = f"{settings.frontend_url.rstrip('/')}/settings"

    if error:
        logging.error(f"Microsoft OAuth error: {error} — {error_description}")
        return RedirectResponse(url=f"{frontend_base}?microsoft=error")

    if not code or not state:
        return RedirectResponse(url=f"{frontend_base}?microsoft=error")

    try:
        state_data = json.loads(base64.urlsafe_b64decode(state).decode())
        user_id = state_data["user_id"]
    except Exception:
        return RedirectResponse(url=f"{frontend_base}?microsoft=error")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            _ms_token_url(),
            data={
                "client_id": settings.azure_ad_client_id,
                "client_secret": settings.azure_ad_client_secret,
                "code": code,
                "redirect_uri": settings.microsoft_redirect_uri,
                "grant_type": "authorization_code",
                "scope": MICROSOFT_SCOPES,
            },
        )

    if response.status_code != 200:
        logging.error(f"Microsoft token exchange failed: {response.text}")
        return RedirectResponse(url=f"{frontend_base}?microsoft=error")

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3599)
    expiry = datetime.now(timezone.utc).timestamp() + expires_in

    db = firebase_admin.firestore.client()
    db.collection("users").document(user_id).update({
        "microsoft_access_token": access_token,
        "microsoft_refresh_token": refresh_token,
        "microsoft_token_expiry": expiry,
        "integrations.microsoftCalendar": True,
        "integrations.outlookMail": True,
    })

    logging.info(f"✅ Microsoft tokens saved for user: {user_id}")
    return RedirectResponse(url=f"{frontend_base}?microsoft=connected")
