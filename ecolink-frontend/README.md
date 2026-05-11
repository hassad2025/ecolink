# 🌿 EcoLink — Frontend Next.js

Plateforme de don et d'échange d'objets entre étudiants.

## Stack

- **Next.js 14** (Pages Router)
- **Tailwind CSS** (responsive)
- **Axios** + **js-cookie** (API + JWT)
- **FastAPI** backend (séparé)
- **MinIO** (stockage photos)

---

## Installation rapide

```bash
# 1. Cloner le projet
git clone https://github.com/votre-user/ecolink.git
cd ecolink/ecolink-frontend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.local.example .env.local
# → Éditer .env.local avec l'URL de votre backend

# 4. Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Structure du projet

```
ecolink-frontend/
├── pages/                  # Routes Next.js
│   ├── index.js            # / — Accueil
│   ├── recherche.js        # /recherche — Filtres + pagination
│   ├── objet/[id].js       # /objet/:id — Fiche détail
│   ├── publier.js          # /publier — Formulaire + upload
│   ├── profil.js           # /profil — Mes annonces + favoris
│   ├── impact.js           # /impact — Graphiques + badges
│   ├── a-propos.js         # /a-propos — Présentation
│   ├── inscription.js      # /inscription — Auth
│   ├── connexion.js        # /connexion — Auth
│   ├── mot-de-passe-oublie.js
│   ├── sitemap.xml.js      # SEO sitemap
│   ├── _app.js             # Provider global
│   └── _document.js        # Head + SW registration
├── components/
│   ├── Layout.js           # Wrapper Navbar + Footer
│   ├── Navbar.js           # Navigation responsive
│   └── AnnonceCard.js      # Carte d'annonce
├── context/
│   └── AuthContext.js      # État utilisateur global
├── lib/
│   └── api.js              # Tous les appels HTTP
├── styles/
│   └── globals.css         # Tailwind + classes utilitaires
├── public/
│   ├── manifest.json       # PWA
│   └── sw.js               # Service Worker
├── .env.local.example
├── Dockerfile
└── .github/workflows/ci.yml
```

---

## Variables d'environnement

| Variable                   | Description              | Défaut                    |
|----------------------------|--------------------------|---------------------------|
| `NEXT_PUBLIC_API_URL`      | URL du backend FastAPI   | `http://localhost:8000`   |
| `NEXT_PUBLIC_SITE_URL`     | URL du site (sitemap)    | `https://ecolink.fr`      |

---

## Lancer avec Docker Compose

Depuis la racine du projet (qui contient `docker-compose.yml`) :

```bash
docker compose up --build
```

Services lancés :
- Frontend : http://localhost:3000
- Backend  : http://localhost:8000
- MinIO    : http://localhost:9001 (console)
- MySQL    : localhost:3306

---

## Pages et fonctionnalités

| Page                        | Route                     | Fonctionnalités                              |
|-----------------------------|---------------------------|----------------------------------------------|
| Accueil                     | `/`                       | Hero, stats, catégories, annonces récentes   |
| Recherche                   | `/recherche`              | Filtres, pagination, résultats               |
| Fiche objet                 | `/objet/[id]`             | Photos, description, favoris, contact        |
| Publier                     | `/publier`                | Formulaire, upload MinIO, validation         |
| Profil                      | `/profil`                 | Mes annonces, favoris, paramètres            |
| Impact                      | `/impact`                 | Stats, graphiques, badges                    |
| À propos                    | `/a-propos`               | Présentation, contact                        |
| Inscription                 | `/inscription`            | Register + auto-login                        |
| Connexion                   | `/connexion`              | Login JWT                                    |
| Mot de passe oublié         | `/mot-de-passe-oublie`    | Reset password                               |

---

## PWA

Le Service Worker (`/public/sw.js`) met en cache les pages statiques.  
Le fichier `manifest.json` permet l'installation sur mobile.

Pour tester : ouvrir DevTools → Application → Service Workers.

---

## CI/CD

Le workflow GitHub Actions (`.github/workflows/ci.yml`) :
1. Lint ESLint sur chaque push/PR
2. Build Next.js
3. Build image Docker (sur `main` seulement)
