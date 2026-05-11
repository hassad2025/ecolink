from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.database import get_db
from app.models.db_models import Category, Item

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get('', description='List categories with item counts')
def list_categories(db: Session = Depends(get_db)):
    # Left join categories with items and count items per category
    rows = (
        db.query(
            Category.id,
            Category.name,
            Category.slug,
            func.count(Item.id).label('count')
        )
        .outerjoin(Item, Item.category_id == Category.id)
        .group_by(Category.id)
        .all()
    )

    return [
        {"id": r.id, "name": r.name, "slug": r.slug, "count": int(r.count)} for r in rows
    ]
