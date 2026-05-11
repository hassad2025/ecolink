from app.core.database import SessionLocal
from app.models.db_models import User

def test_connection():
    db = SessionLocal()
    try:
        # Tenter de récupérer un utilisateur
        user = db.query(User).first()
        if user:
            print(f"✅ Connexion réussie ! Utilisateur trouvé : {user.name}")
            print(f"   Email: {user.email}")
        else:
            print("✅ Connexion réussie ! Aucun utilisateur trouvé.")
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()