from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
import pymysql

# Patch pour que SQLAlchemy utilise pymysql au lieu de MySQLdb
pymysql.install_as_MySQLdb()

settings = get_settings()

# Création du moteur de base de données
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Vérifie la connexion avant utilisation
    pool_recycle=3600,       # Recycle les connexions après 1 heure
    echo=True                 # Affiche les requêtes SQL (utile pour debug)
)

# Création d'une session locale
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles SQLAlchemy
Base = declarative_base()

# Dépendance pour obtenir une session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()  # ← AJOUTÉ : commit automatique si tout se passe bien
    except Exception:
        db.rollback()  # ← AJOUTÉ : rollback en cas d'erreur
        raise
    finally:
        db.close()