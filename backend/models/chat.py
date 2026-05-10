# backend/models/chat.py
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator

class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    message: str
    user_id: str = Field(alias="userId")
    conversation_id: str = Field(alias="conversationId")
    
    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class StreamEventType(str, Enum):
    TOKEN = "token"
    TOOL_START = "tool_start"
    TOOL_END = "tool_end"
    CONFIRM = "confirm"
    DONE = "done"
    ERROR = "error"

class StreamEvent(BaseModel):
    type: StreamEventType
    content: str | None = None
    tool_name: str | None = None
    tool_label: str | None = None
    result: str | None = None
    confirm_message: str | None = None
