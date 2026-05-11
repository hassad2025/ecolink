from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.db_models import User
from pydantic import BaseModel

router = APIRouter(prefix="/user", tags=["Users"])


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    email:      Optional[str] = None
    avatar_url: Optional[str] = None
    phone:      Optional[str] = None   # ← ajouté


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = parts[1]
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get('/profile')
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id":     current_user.id,
        "name":   current_user.name,
        "email":  current_user.email,
        "avatar": current_user.avatar,
        "phone":  getattr(current_user, 'phone', None),
    }


@router.put('/profile')
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = False

    if payload.first_name is not None or payload.last_name is not None:
        first    = payload.first_name or ''
        last     = payload.last_name  or ''
        new_name = (first + ' ' + last).strip()
        if new_name:
            current_user.name = new_name
            updated = True

    if payload.email is not None and payload.email.strip():
        existing = db.query(User).filter(
            User.email == payload.email.strip(),
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        current_user.email = payload.email.strip()
        updated = True

    if payload.avatar_url is not None:
        current_user.avatar = payload.avatar_url
        updated = True

    # Téléphone — stocké si le champ existe dans le modèle
    if payload.phone is not None:
        if hasattr(current_user, 'phone'):
            current_user.phone = payload.phone.strip() or None
            updated = True

    if updated:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

    return {
        "success": True,
        "user": {
            "id":     current_user.id,
            "name":   current_user.name,
            "email":  current_user.email,
            "avatar": current_user.avatar,
            "phone":  getattr(current_user, 'phone', None),
        }
    }


@router.delete('')
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"success": True, "message": "Compte supprimé"}