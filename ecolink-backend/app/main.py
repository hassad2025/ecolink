from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, SessionLocal
from app.models.db_models import Base, Category
from app.api import auth
from app.api import uploads
from app.api import items
from app.api import categories
from app.api import admin
from app.api import publications
from app.api import users
from fastapi.staticfiles import StaticFiles
import logging
import os
from pathlib import Path

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

# Seed des catégories si la table est vide
def seed_categories():
    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            cats = [
                Category(name='Électronique', slug='electronique', icon='💻'),
                Category(name='Livres',       slug='livres',       icon='📚'),
                Category(name='Mobilier',     slug='mobilier',     icon='🛋'),
                Category(name='Vêtements',    slug='vetements',    icon='👕'),
                Category(name='Sport',        slug='sport',        icon='⚽'),
                Category(name='Cuisine',      slug='cuisine',      icon='🍳'),
                Category(name='Autre',        slug='autre',        icon='📦'),
            ]
            db.add_all(cats)
            db.commit()
    finally:
        db.close()

seed_categories()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Création de l'application
app = FastAPI(
    title="EcoLink API",
    description="API Backend pour l'application EcoLink",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(auth.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(publications.router, prefix="/api")
app.include_router(users.router, prefix="/api")

# Serve static uploads
static_dir = Path(__file__).parent.parent / 'static'
if static_dir.exists():
    app.mount('/static', StaticFiles(directory=str(static_dir)), name='static')

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API EcoLink",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Le serveur fonctionne correctement"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)