from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.database import get_db
from app.models.db_models import Category, Item

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post('/refresh_counts', description='Recompute and return category counts and item stats (dev only)')
def refresh_counts(db: Session = Depends(get_db)):
    # Compute category counts
    cats = (
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

    # Compute item stats by condition
    stats = db.query(Item.condition, func.count(Item.id).label('count')).group_by(Item.condition).all()

    return {
        'categories': [{ 'id': r.id, 'name': r.name, 'slug': r.slug, 'count': int(r.count) } for r in cats],
        'item_stats': { r[0]: int(r[1]) for r in stats }
    }
