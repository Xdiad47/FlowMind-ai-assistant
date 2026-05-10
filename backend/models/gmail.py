# backend/models/gmail.py
from pydantic import BaseModel, field_validator

class EmailContact(BaseModel):
    email: str
    name: str | None = None

class EmailThread(BaseModel):
    id: str
    subject: str
    snippet: str
    from_contact: EmailContact
    date: str
    is_read: bool = False
    is_starred: bool = False
    labels: list[str] = []
    message_count: int = 1

class DeleteThreadsRequest(BaseModel):
    thread_ids: list[str]
    
    @field_validator('thread_ids')
    @classmethod
    def must_not_be_empty(cls, v):
        if not v:
            raise ValueError('thread_ids cannot be empty')
        return v

class ArchiveThreadsRequest(BaseModel):
    thread_ids: list[str]

class DraftReplyRequest(BaseModel):
    thread_id: str
    content: str
