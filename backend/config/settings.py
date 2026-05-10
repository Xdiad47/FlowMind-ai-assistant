# backend/config/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8000
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000"]
    firebase_project_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    master_encryption_key: str = ""
    platform_groq_api_key: str = ""
    platform_gemini_api_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    nextauth_secret: str = ""
    internal_api_secret: str = ""
    
    model_config = SettingsConfigDict(env_file="backend/.env", extra="ignore")

# Singleton instance
settings = Settings()
