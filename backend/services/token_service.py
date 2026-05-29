# backend/services/token_service.py
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from backend.config.settings import settings
import firebase_admin.firestore

async def get_valid_google_token(user_id: str, forwarded_token: str | None = None) -> str:
    """
    Returns a valid Google access token for the given user.
    Always validates against Firestore and refreshes if expired.
    The forwarded_token from NextAuth is used to update Firestore if it looks newer,
    but we never return it blindly — Firestore + refresh logic is the source of truth.
    """
    db = firebase_admin.firestore.client()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_doc.to_dict()
    access_token = data.get('google_access_token')
    refresh_token = data.get('google_refresh_token')
    expiry_ts = data.get('google_token_expiry')

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Google account not connected. Please sign out and sign in again.")

    # Check if Firestore token is still valid (30-min buffer to be safe)
    now = datetime.now(timezone.utc).timestamp()
    if access_token and expiry_ts and expiry_ts > (now + 1800):
        return access_token

    # Token expired — refresh it
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google token expired. Please sign out and sign in again.")

        token_data = response.json()
        new_access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3599)
        new_expiry = datetime.now(timezone.utc).timestamp() + expires_in

        user_ref.update({
            'google_access_token': new_access_token,
            'google_token_expiry': new_expiry
        })

        return new_access_token

async def get_valid_microsoft_token(user_id: str) -> str:
    db = firebase_admin.firestore.client()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_doc.to_dict()
    access_token = data.get('microsoft_access_token')
    refresh_token = data.get('microsoft_refresh_token')
    expiry_ts = data.get('microsoft_token_expiry')

    if not access_token or not refresh_token:
        raise HTTPException(status_code=401, detail="Microsoft account not connected. Please connect it in Settings.")

    now = datetime.now(timezone.utc).timestamp()
    if expiry_ts and expiry_ts > (now + 300):
        return access_token

    token_url = f"https://login.microsoftonline.com/{settings.azure_ad_tenant_id}/oauth2/v2.0/token"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_url,
            data={
                "client_id": settings.azure_ad_client_id,
                "client_secret": settings.azure_ad_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Microsoft token expired. Please reconnect in Settings.")

    token_data = response.json()
    new_access_token = token_data['access_token']
    expires_in = token_data.get('expires_in', 3599)
    new_expiry = datetime.now(timezone.utc).timestamp() + expires_in

    user_ref.update({
        'microsoft_access_token': new_access_token,
        'microsoft_token_expiry': new_expiry
    })

    return new_access_token
