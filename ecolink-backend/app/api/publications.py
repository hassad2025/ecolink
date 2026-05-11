from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.db_models import Item, ItemImage, User
from pydantic import BaseModel

router = APIRouter(prefix="/publications", tags=["Publications"])


class PublicationOut(BaseModel):
    id: int
    title: str
    description: str
    created_at: str
    images: List[str] = []

    class Config:
        from_attributes = True


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


@router.get('', response_model=List[PublicationOut])
def list_publications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.user_id == current_user.id).order_by(Item.created_at.desc()).all()
    out = []
    for it in items:
        imgs = [ (img.image_url if img.image_url.startswith('http') else f"/static/{img.image_url}") for img in (it.images or []) ]
        out.append(PublicationOut(id=it.id, title=it.title, description=it.description, created_at=it.created_at.isoformat(), images=imgs))
    return out


@router.delete('/{item_id}')
def delete_publication(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this item")

    # Cascade delete handled by ORM relationships
    db.delete(item)
    db.commit()

    return {"success": True, "message": "Publication deleted"}
