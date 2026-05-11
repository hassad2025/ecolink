from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.database import get_db
from app.core.security import verify_token
import logging
from app.models.db_models import Item, ItemImage, User, Category, ItemCondition
from pydantic import BaseModel
from pathlib import Path
import os
from uuid import uuid4

router = APIRouter(prefix="/items", tags=["Items"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ItemImageSchema(BaseModel):
    id: int
    image_url: str
    is_primary: bool


class ItemOwnerSchema(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class ItemResponse(BaseModel):
    id: int
    title: str
    description: str
    category_id: int
    condition: str
    user_id: int
    owner: Optional[ItemOwnerSchema] = None
    images: Optional[List[ItemImageSchema]] = []
    pickup_only: bool
    views: int
    status: str
    location_city: Optional[str] = None
    created_at: Optional[str]
    distance: Optional[float] = None


class SearchResponse(BaseModel):
    items: List[ItemResponse]
    total: int


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


def get_condition_value(item):
    """Récupère la valeur string de condition (colonne item_condition en SQL)"""
    c = item.condition
    if c is None:
        return "good"
    return c.value if hasattr(c, 'value') else str(c)


def get_status_value(item):
    """Récupère la valeur string de status (colonne item_status en SQL)"""
    s = item.status
    if s is None:
        return "active"
    return s.value if hasattr(s, 'value') else str(s)


def build_item_response(item, owner=None):
    images = [
        ItemImageSchema(id=i.id, image_url=i.image_url, is_primary=i.is_primary)
        for i in item.images
    ]
    if owner is None and getattr(item, 'owner', None):
        owner = ItemOwnerSchema(
            id=item.owner.id,
            name=item.owner.name,
            avatar=item.owner.avatar,
            email=item.owner.email,
            phone=getattr(item.owner, 'phone', None),
        )
    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        category_id=item.category_id,
        condition=get_condition_value(item),
        user_id=item.user_id,
        owner=owner,
        images=images,
        pickup_only=item.pickup_only or False,
        views=item.views or 0,
        status=get_status_value(item),
        location_city=item.location_city,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


def save_images(files, item_id, db, has_primary=False):
    for idx, file in enumerate(files):
        if not file.content_type or not file.content_type.startswith('image/'):
            continue
        ext = os.path.splitext(file.filename)[1]
        fname = f"{uuid4().hex}{ext}"
        dest = UPLOAD_DIR / fname
        with open(dest, 'wb') as f:
            f.write(file.file.read())
        img = ItemImage(
            item_id=item_id,
            image_url=f"/static/uploads/{fname}",
            is_primary=(not has_primary and idx == 0),
        )
        db.add(img)
    db.commit()


# ── GET /items/recent ────────────────────────────────────
@router.get('/recent', response_model=List[ItemResponse])
def recent_items(limit: int = 12, db: Session = Depends(get_db)):
    items = db.query(Item).order_by(Item.created_at.desc()).limit(limit).all()
    return [build_item_response(it) for it in items]


# ── GET /items/search ────────────────────────────────────
@router.get('/search', response_model=SearchResponse)
def search_items(
    q: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    condition: Optional[str] = None,
    sort: Optional[str] = 'newest',
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db),
):
    query = db.query(Item)

    if category and not category.isdigit():
        query = query.join(Category)

    if q:
        like_q = f"%{q}%"
        query = query.filter(
            (Item.title.ilike(like_q)) | (Item.description.ilike(like_q))
        )

    if category:
        if category.isdigit():
            query = query.filter(Item.category_id == int(category))
        else:
            query = query.filter(Category.slug == category)

    if location:
        loc = f"%{location}%"
        query = query.filter(
            (Item.location_city.ilike(loc)) | (Item.location_address.ilike(loc))
        )

    if condition:
        conds = [c.strip().lower() for c in condition.split(',') if c.strip()]
        if conds:
            query = query.filter(Item.condition.in_(conds))

    if sort == 'popular':
        query = query.order_by(Item.views.desc())
    else:
        query = query.order_by(Item.created_at.desc())

    total = query.count()
    if page < 1:
        page = 1
    items = query.offset((page - 1) * limit).limit(limit).all()

    return SearchResponse(items=[build_item_response(it) for it in items], total=total)


# ── GET /items/user/stats ────────────────────────────────
@router.get('/user/stats')
def user_impact_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items_given = db.query(func.count(Item.id)).filter(Item.user_id == current_user.id).scalar() or 0
    total_items = db.query(func.count(Item.id)).scalar() or 0
    co2_saved   = round(items_given * 17.5, 1)
    points      = items_given * 50
    if items_given >= 10: points += 200
    if items_given >= 25: points += 500

    return {
        "totalItemsGiven":     items_given,
        "totalItemsReceived":  0,
        "co2Saved":            co2_saved,
        "communityRank":       1,
        "points":              points,
        "totalCommunityItems": total_items,
    }


# ── GET /items/{item_id} ─────────────────────────────────
@router.get('/{item_id}', response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    it = db.query(Item).filter(Item.id == item_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    return build_item_response(it)


# ── POST /items ──────────────────────────────────────────
@router.post('', response_model=ItemResponse)
def create_item(
    title:                str            = Form(...),
    description:          str            = Form(...),
    category_id:          Optional[int]  = Form(None),
    category:             Optional[str]  = Form(None),
    condition:            str            = Form(...),
    pickup_only:          Optional[bool] = Form(True),
    location_lat:         Optional[float]= Form(None),
    location_lng:         Optional[float]= Form(None),
    location_address:     Optional[str]  = Form(None),
    location_city:        Optional[str]  = Form(None),
    location_postal_code: Optional[str]  = Form(None),
    images:               Optional[List[UploadFile]] = File(None),
    current_user: User    = Depends(get_current_user),
    db: Session           = Depends(get_db),
):
    try:
        # Valider la condition
        try:
            condition_value = ItemCondition(condition).value
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid condition value: {condition}. Valeurs acceptées: new, good, fair, poor")

        # Résoudre la catégorie
        if category_id is None:
            if category:
                cat = db.query(Category).filter(Category.slug == category).first()
                if not cat:
                    raise HTTPException(status_code=400, detail="Invalid category")
                category_id = cat.id
            else:
                raise HTTPException(status_code=400, detail="category_id or category required")

        item = Item(
            title=title,
            description=description,
            category_id=category_id,
            condition=condition_value,
            user_id=current_user.id,
            pickup_only=bool(pickup_only),
            location_lat=location_lat,
            location_lng=location_lng,
            location_address=location_address,
            location_city=location_city,
            location_postal_code=location_postal_code,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        if images:
            save_images(images, item.id, db, has_primary=False)
            db.refresh(item)

        owner = ItemOwnerSchema(
            id=current_user.id,
            name=current_user.name,
            avatar=current_user.avatar,
            email=current_user.email,
            phone=getattr(current_user, 'phone', None),
        )
        return build_item_response(item, owner=owner)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── PUT /items/{item_id} ─────────────────────────────────
@router.put('/{item_id}', response_model=ItemResponse)
def update_item(
    item_id:       int,
    title:         str            = Form(...),
    description:   str            = Form(...),
    condition:     str            = Form(...),
    pickup_only:   Optional[bool] = Form(True),
    location_city: Optional[str]  = Form(None),
    images:        Optional[List[UploadFile]] = File(None),
    current_user:  User           = Depends(get_current_user),
    db:            Session        = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        condition_value = ItemCondition(condition).value
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid condition: {condition}")

    item.title         = title
    item.description   = description
    item.condition     = condition_value
    item.pickup_only   = bool(pickup_only)
    item.location_city = location_city
    db.commit()
    db.refresh(item)

    if images:
        has_primary = any(i.is_primary for i in item.images)
        save_images(images, item.id, db, has_primary=has_primary)
        db.refresh(item)

    owner = ItemOwnerSchema(
        id=current_user.id,
        name=current_user.name,
        avatar=current_user.avatar,
        email=current_user.email,
        phone=getattr(current_user, 'phone', None),
    )
    return build_item_response(item, owner=owner)


# ── DELETE /items/{item_id} ──────────────────────────────
@router.delete('/{item_id}')
def delete_item(
    item_id:      int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for img in item.images:
        try:
            p = Path(__file__).resolve().parents[2] / img.image_url.lstrip("/")
            if p.exists():
                p.unlink()
        except Exception:
            pass

    db.delete(item)
    db.commit()
    return {"success": True, "id": item_id}