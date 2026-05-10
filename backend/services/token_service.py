# backend/services/token_service.py
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from backend.config.settings import settings
import firebase_admin.firestore

async def get_valid_google_token(user_id: str, forwarded_token: str | None = None) -> str:
    """
    Returns a valid Google access token for the given user.
    Priority:
    1. forwarded_token from the Next.js proxy (already refreshed by NextAuth)
    2. Stored token in Firestore (refreshed if expired)
    """
    # If the proxy forwarded a fresh token, use it directly
    if forwarded_token:
        return forwarded_token

    db = firebase_admin.firestore.client()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    data = user_doc.to_dict()
    access_token = data.get('google_access_token')
    refresh_token = data.get('google_refresh_token')
    expiry_ts = data.get('google_token_expiry')
    
    if not access_token or not refresh_token:
        raise HTTPException(status_code=401, detail="Google account not connected. Please sign out and sign in again.")
        
    # Check if expired (with 5 minute buffer)
    now = datetime.now(timezone.utc).timestamp()
    if expiry_ts and expiry_ts > (now + 300):
        return access_token
        
    # Refresh token
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
        
        # Store back to firestore
        user_ref.update({
            'google_access_token': new_access_token,
            'google_token_expiry': new_expiry
        })
        
        return new_access_token

async def get_valid_microsoft_token(user_id: str) -> str:
    # Placeholder for Microsoft Graph token refresh
    raise NotImplementedError("Microsoft integration not yet implemented")
