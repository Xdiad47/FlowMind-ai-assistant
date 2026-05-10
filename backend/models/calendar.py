# backend/models/calendar.py
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

class AttendeeResponse(str, Enum):
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"
    NEEDS_ACTION = "needsAction"

class Attendee(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    email: str
    name: str | None = None
    response_status: AttendeeResponse = Field(default=AttendeeResponse.NEEDS_ACTION, alias="responseStatus")

class CalendarEvent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str | None = None
    title: str
    description: str | None = None
    start_time: str = Field(alias="startTime")       # ISO 8601
    end_time: str = Field(alias="endTime")            # ISO 8601
    location: str | None = None
    attendees: list[Attendee] = Field(default_factory=list)
    is_recurring: bool = Field(default=False, alias="isRecurring")
    source: str = "google"
    meet_link: str | None = Field(default=None, alias="meetLink")

class CreateEventRequest(BaseModel):
    title: str
    start_time: str
    end_time: str
    description: str | None = None
    attendees: list[str] = Field(default_factory=list)    # list of email strings
    location: str | None = None

class GetEventsRequest(BaseModel):
    start: str    # ISO date string
    end: str      # ISO date string
