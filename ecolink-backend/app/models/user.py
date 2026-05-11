from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# Schémas pour les requêtes
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refreshToken: str

# Schémas pour les réponses
class UserResponse(BaseModel):
    id: int  # ← Changé : int au lieu de str (pour correspondre à la DB)
    name: str
    email: EmailStr
    role: str = "user"

    class Config:
        from_attributes = True  # ← Important pour SQLAlchemy

class TokenResponse(BaseModel):
    token: str
    refreshToken: str
    user: UserResponse

class RefreshResponse(BaseModel):
    token: str
    user: UserResponse

class LogoutResponse(BaseModel):
    success: bool


# Schémas pour réinitialisation de mot de passe
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str = Field(..., min_length=6)


class SimpleResponse(BaseModel):
    success: bool
    detail: Optional[str] = None