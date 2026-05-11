from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # JWT Configuration - TOUS les champs doivent être déclarés
    JWT_SECRET: str = "secret"
    JWT_REFRESH_SECRET: str = "refresh_secret"
    JWT_ALGORITHM: str = "HS256"  # ← Ajoute ce champ !
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 jours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 jours
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/ecolink_db"
    
    # SMTP / Email (pour envoi de mails réels)
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True
    
    class Config:
        env_file = ".env"
        # Optionnel: pour permettre les champs supplémentaires
        # extra = "ignore"  # ← Ignore les champs non déclarés

@lru_cache()
def get_settings():
    return Settings()