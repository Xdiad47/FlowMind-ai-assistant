# backend/models/user.py
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

class UserPlan(str, Enum):
    FREE = "free"
    PRO_BYOK = "pro_byok"
    PRO_HOSTED = "pro_hosted"
    POWER = "power"

class ApiProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    GROQ = "groq"
    HOSTED = "hosted"

class UserPermissions(BaseModel):
    can_delete_emails: bool = False
    can_create_events: bool = True
    can_edit_events: bool = True
    can_delete_events: bool = False
    can_reply_emails: bool = False
    can_send_emails: bool = False

class UserIntegrations(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    google_calendar: bool = Field(default=False, alias="googleCalendar")
    gmail: bool = False
    microsoft_calendar: bool = Field(default=False, alias="microsoftCalendar")
    outlook_mail: bool = Field(default=False, alias="outlookMail")

class UserProfile(BaseModel):
    model_config = ConfigDict(extra='ignore', populate_by_name=True)
    
    id: str
    email: str
    name: str
    plan: UserPlan = UserPlan.FREE
    api_provider: ApiProvider | None = None
    integrations: UserIntegrations = Field(default_factory=UserIntegrations)
    permissions: UserPermissions = Field(default_factory=UserPermissions)
    briefing_hour: int = 7
    timezone: str = "UTC"
    actions_this_month: int = 0
