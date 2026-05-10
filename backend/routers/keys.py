# backend/routers/keys.py
from fastapi import APIRouter, Depends, Request
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user
from backend.services.key_vault_service import encrypt_api_key
import firebase_admin.firestore

# SECURITY: Never log request body — contains API key
router = APIRouter(prefix="/keys", tags=["keys"])

@router.post("")
async def save_api_key(
    request: Request,
    user: UserProfile = Depends(get_current_user)
):
    body = await request.json()
    provider = body.get('provider')
    api_key = body.get('key')
    
    if not provider or not api_key:
        return {"success": False, "error": "Provider and key are required"}
        
    encrypted = encrypt_api_key(api_key, user.id)
    
    db = firebase_admin.firestore.client()
    db.collection('users').document(user.id).update({
        'api_provider': provider,
        'api_key_encrypted': encrypted
    })
    
    return {"success": True}

@router.delete("")
async def remove_api_key(user: UserProfile = Depends(get_current_user)):
    db = firebase_admin.firestore.client()
    db.collection('users').document(user.id).update({
        'api_provider': firebase_admin.firestore.DELETE_FIELD,
        'api_key_encrypted': firebase_admin.firestore.DELETE_FIELD
    })
    
    return {"success": True}
