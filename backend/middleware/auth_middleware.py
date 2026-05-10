# backend/middleware/auth_middleware.py
from fastapi import Request, HTTPException, Depends
import httpx
from backend.config.settings import settings
from backend.services.auth_service import get_user_profile
from backend.models.user import UserProfile

async def get_current_user(request: Request) -> UserProfile:
    """
    Dependency to get the current authenticated user from NextAuth JWT.
    """
    internal_secret = request.headers.get("x-internal-secret")
    user_id_header = request.headers.get("x-user-id")
    
    if internal_secret and user_id_header and internal_secret == settings.internal_api_secret:
        user = await get_user_profile(user_id_header)
        if user:
            return user

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
        
    token = auth_header.split(" ")[1]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://oauth2.googleapis.com/tokeninfo?access_token={token}")
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google access token")
                
            payload = response.json()
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
                
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Could not contact Google to validate credentials")
        
    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

def require_integration(integration: str):
    """
    Dependency to check if user has a required integration.
    Usage: Depends(require_integration('gmail'))
    """
    async def _require_integration(user: UserProfile = Depends(get_current_user)) -> UserProfile:
        integrations = user.integrations.model_dump()
        if not integrations.get(integration):
            raise HTTPException(
                status_code=403, 
                detail=f"{integration.replace('_', ' ').title()} integration required"
            )
        return user
    return _require_integration
