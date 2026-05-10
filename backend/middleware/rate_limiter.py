# backend/middleware/rate_limiter.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

# Can define dynamic rate limiting based on user tier if needed
def get_user_tier_limit(request: Request) -> str:
    # A real implementation might check user tier from request.state.user
    # but that requires user to be populated before rate limiting
    return "60/minute"
