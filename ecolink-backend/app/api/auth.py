from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.user import (
    UserCreate, UserLogin, TokenRefresh,
    TokenResponse, RefreshResponse, LogoutResponse
)
from app.models.db_models import User
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token,
    verify_token
)
from app.core.database import get_db
from app.models.user import ForgotPasswordRequest, ResetPasswordRequest, SimpleResponse
from app.core.email import send_email
from app.core.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur"""
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        
        # Hasher le mot de passe
        hashed_password = get_password_hash(user_data.password)
        
        # Créer l'utilisateur en DB
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            role="user"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Créer les tokens
        access_token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
        refresh_token = create_refresh_token({"sub": str(new_user.id)})
        
        return TokenResponse(
            token=access_token,
            refreshToken=refresh_token,
            user={
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur register: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'inscription")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Connexion d'un utilisateur"""
    try:
        # Récupérer l'utilisateur de la DB
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
        # Vérifier le mot de passe
        if not verify_password(user_data.password, user.password):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
        # Créer les tokens
        access_token = create_access_token({"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return TokenResponse(
            token=access_token,
            refreshToken=refresh_token,
            user={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur login: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la connexion")

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Rafraîchir un token d'accès"""
    try:
        # Vérifier le refresh token
        payload = verify_token(token_data.refreshToken, token_type="refresh")
        if not payload:
            raise HTTPException(status_code=401, detail="Refresh token invalide")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Récupérer l'utilisateur
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
        # Créer un nouveau token d'accès
        new_access_token = create_access_token({"sub": str(user.id), "email": user.email})
        
        return RefreshResponse(
            token=new_access_token,
            user={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur refresh: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du rafraîchissement")

@router.post("/logout", response_model=LogoutResponse)
async def logout():
    """Déconnexion d'un utilisateur"""
    # Pour l'instant, simple confirmation
    # Dans une version plus avancée, on pourrait blacklister le token
    return LogoutResponse(success=True)


@router.post("/forgot-password", response_model=SimpleResponse)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Génère un token de réinitialisation et (simulé) envoie un email."""
    try:
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            # Ne pas révéler que l'email est absent pour la sécurité
            return SimpleResponse(success=True, detail="Si ce compte existe, un lien a été envoyé.")

        # Créer un token court pour la réinitialisation (utilise le secret refresh)
        reset_token = create_refresh_token({"sub": str(user.id), "action": "reset_password"})

        # Construire l'URL de réinitialisation (frontend doit avoir /reset-password)
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"

        # Préparer le contenu email
        subject = "Réinitialisation de votre mot de passe EcoLink"
        html = f"""
<!doctype html>
<html>
<body style="font-family: Arial, sans-serif; color: #111;">
<div style="max-width:600px;margin:0 auto;padding:20px;text-align:center;">
  <div style="margin-bottom:20px;">
    <!-- Inline EcoLink leaf logo -->
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12c0-4 4-8 9-8 0 5-4 9-9 9v-1z" fill="#10B981"/>
      <path d="M21 12c0 4-4 8-9 8 0-5 4-9 9-9v1z" fill="#059669"/>
    </svg>
  </div>
  <h2 style="color:#064E3B;margin:0 0 12px 0">Réinitialisation du mot de passe</h2>
  <p style="margin:0 0 12px 0">Bonjour {user.name},</p>
  <p style="margin:0 0 18px 0">Vous avez demandé à réinitialiser votre mot de passe pour EcoLink. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
  <p style="margin:0 0 20px 0">
    <a href="{reset_url}" style="display:inline-block;padding:12px 22px;background-color:#10B981;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
      Réinitialiser mon mot de passe
    </a>
  </p>
  <p style="font-size:13px;color:#6B7280;margin-top:18px;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur:</p>
  <p style="word-break:break-all;color:#065F46;font-size:13px;">{reset_url}</p>
  <p style="color:#6B7280;margin-top:18px;">— L'équipe EcoLink</p>
</div>
</body>
</html>
"""

        # Si SMTP configuré, envoyer en background, sinon logguer l'URL (développement)
        if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
            # Schedule send in background
            def _send():
                try:
                    send_email(user.email, subject, html, plain_text=f"Réinitialisez votre mot de passe: {reset_url}")
                except Exception as e:
                    print(f"Failed to send reset email to {user.email}: {e}")

            background_tasks.add_task(_send)
        else:
            print(f"[Password Reset] (no SMTP) Link for {user.email}: {reset_url}")

        return SimpleResponse(success=True, detail="Si ce compte existe, un lien a été envoyé.")
    except Exception as e:
        print(f"❌ Erreur forgot_password: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.post("/reset-password", response_model=SimpleResponse)
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Réinitialise le mot de passe en validant le token fourni."""
    try:
        payload = verify_token(data.token, token_type="refresh")
        if not payload:
            raise HTTPException(status_code=401, detail="Token invalide ou expiré")

        # Optionnel: vérifier l'action
        if payload.get("action") != "reset_password":
            raise HTTPException(status_code=401, detail="Token invalide")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        # Mettre à jour le mot de passe
        user.password = get_password_hash(data.newPassword)
        db.add(user)
        db.commit()

        return SimpleResponse(success=True, detail="Mot de passe réinitialisé avec succès")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur reset_password: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")