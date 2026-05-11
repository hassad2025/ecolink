FROM python:3.11-slim

WORKDIR /app

# Copier et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Variables d'environnement Backend
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=587
ENV SMTP_USER=hassadakedjou910@gmail.com
ENV SMTP_PASSWORD=ozhipujocgaegyfo
ENV SMTP_FROM_EMAIL=hassadakedjou910@gmail.com
ENV SMTP_USE_TLS=true
ENV JWT_SECRET=ton_secret_jwt_super_secret
ENV JWT_REFRESH_SECRET=ton_secret_refresh_jwt_super_secret
ENV JWT_ALGORITHM=HS256
# En Docker, localhost = le conteneur lui-même
# "db" = nom du service MySQL dans docker-compose
ENV DATABASE_URL=mysql+pymysql://root:@db:3306/ecolink_db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
