# backend/routers/gmail.py
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from backend.models.gmail import DeleteThreadsRequest, ArchiveThreadsRequest, DraftReplyRequest
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user, require_integration
from backend.services import token_service, gmail_service
import firebase_admin.firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gmail", tags=["gmail"])

from firebase_admin import firestore as admin_firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

async def log_action(
    user_id: str,
    category: str,
    action_type: str,
    description: str,
    reversible: bool
) -> None:
    """Write action to Firestore audit log"""
    try:
        db = admin_firestore.client()
        db.collection('users').document(user_id)\
          .collection('actionLog').add({
            'category': category,
            'action_type': action_type,
            'description': description,
            'reversible': reversible,
            'status': 'success',
            'timestamp': SERVER_TIMESTAMP
        })
    except Exception:
        pass  # Never fail a request because of logging

@router.get("/threads")
async def get_threads(
    request: Request,
    q: str = "is:unread is:important",
    max: int = 20,
    user: UserProfile = Depends(require_integration('gmail'))
):
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    try:
        threads = await gmail_service.search_threads(access_token, q, max)
    except Exception as e:
        err_str = str(e)
        logger.exception("Gmail API error for user %s: %s", user.id, err_str)
        if "insufficient" in err_str.lower() or "403" in err_str:
            raise HTTPException(status_code=403, detail="Gmail access denied — please sign out and sign back in to re-grant permissions.")
        if "401" in err_str or "invalid credentials" in err_str.lower() or "token" in err_str.lower():
            raise HTTPException(status_code=401, detail="Google token invalid or expired — please sign out and sign back in.")
        raise HTTPException(status_code=502, detail=f"Gmail API error: {err_str[:300]}")
    return {"success": True, "data": [t.model_dump() for t in threads]}

@router.delete("/threads")
async def delete_threads(
    request: Request,
    body: DeleteThreadsRequest,
    user: UserProfile = Depends(require_integration('gmail'))
):
    if not user.permissions.can_delete_emails:
        raise HTTPException(status_code=403, detail="Email deletion not permitted. Enable in Settings > Permissions.")
        
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    count = await gmail_service.delete_threads(access_token, body.thread_ids)
    
    await log_action(user.id, "gmail", "delete_emails", f"Deleted {count} emails", False)
    
    return {"success": True, "data": {"deleted_count": count}}

@router.post("/threads/archive")
async def archive_threads(
    request: Request,
    body: ArchiveThreadsRequest, 
    user: UserProfile = Depends(require_integration('gmail'))
):
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    await gmail_service.archive_threads(access_token, body.thread_ids)
    return {"success": True, "data": None}

@router.post("/threads/mark-read")
async def mark_as_read(
    request: Request,
    body: ArchiveThreadsRequest, 
    user: UserProfile = Depends(require_integration('gmail'))
):
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    await gmail_service.mark_as_read(access_token, body.thread_ids)
    return {"success": True, "data": None}

@router.post("/draft")
async def create_draft(
    request: Request,
    body: DraftReplyRequest, 
    user: UserProfile = Depends(require_integration('gmail'))
):
    if not user.permissions.can_reply_emails:
        raise HTTPException(status_code=403, detail="Email replying not permitted. Enable in Settings > Permissions.")
        
    forwarded_token = request.headers.get("x-google-access-token")
    access_token = await token_service.get_valid_google_token(user.id, forwarded_token)
    draft_id = await gmail_service.create_draft(access_token, body.thread_id, body.content)
    return {"success": True, "data": {"draft_id": draft_id}}

