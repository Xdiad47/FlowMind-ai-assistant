# backend/agent/tools/base_tool.py
# Base context that all tools need — injected at runtime
# Use a Python contextvars.ContextVar to share access_token + user_id
# with tools without passing them as LLM-visible parameters
from contextvars import ContextVar

_access_token: ContextVar[str] = ContextVar('access_token', default='')
_user_id: ContextVar[str] = ContextVar('user_id', default='')
_permissions: ContextVar[dict] = ContextVar('permissions', default={})

def set_tool_context(access_token: str, user_id: str, permissions: dict):
    _access_token.set(access_token)
    _user_id.set(user_id)
    _permissions.set(permissions)

def get_access_token() -> str:
    return _access_token.get()

def get_user_id() -> str:
    return _user_id.get()

def get_permissions() -> dict:
    return _permissions.get()
