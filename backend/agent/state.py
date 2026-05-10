# backend/agent/state.py
from typing import TypedDict, Annotated, Any
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # Message history — add_messages reducer appends instead of replacing
    messages: Annotated[list[BaseMessage], add_messages]
    # Runtime context injected before graph runs
    user_id: str
    conversation_id: str
    access_token: str          # Google OAuth token (decrypted, valid)
    permissions: dict          # UserPermissions as dict
    plan: str                  # user plan for feature gating
    # Confirmation flow state
    pending_confirmation: dict | None   # { action, args, message }
    awaiting_confirmation: bool
    # Output tracking
    actions_taken: list[dict]  # list of { tool, description, timestamp }
