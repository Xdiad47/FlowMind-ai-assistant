# backend/routers/integrations.py
from fastapi import APIRouter, Depends
from backend.models.user import UserProfile
from backend.middleware.auth_middleware import get_current_user
import firebase_admin.firestore

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.post("/revoke")
async def revoke_integration(
    body: dict,
    user: UserProfile = Depends(get_current_user)
):
    integration = body.get("integration")
    if not integration or integration not in ["googleCalendar", "gmail", "microsoftCalendar", "outlookMail"]:
        return {"success": False, "error": "Invalid integration"}
        
    db = firebase_admin.firestore.client()
    
    updates = {
        f'integrations.{integration}': False
    }
    
    # If revoking google calendar or gmail, we might want to clear google tokens 
    # if BOTH are revoked, but for now we'll just keep the tokens and update the flag.
    # In a full implementation, you'd check if any google services are still connected.
    
    db.collection('users').document(user.id).update(updates)
    
    return {"success": True}
