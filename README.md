# BudgetApp

Application web de gestion de budget personnel avec agrégation bancaire via l'API Powens (Biapi). Architecture microservices entièrement conteneurisée avec Docker.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│                  dev: :5173  /  prod: :80                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                     ┌───────▼────────┐
                     │   Frontend     │
                     │  React + Vite  │
                     └───┬───────┬───┘
                         │       │
           ┌─────────────▼─┐   ┌─▼─────────────┐
           │   Auth API    │   │  Powens API    │
           │  Node/Express │   │ Node/Express   │
           │  :3001        │   │ :3003          │
           └──────┬────────┘   └──────┬─────────┘
                  │                   │
           ┌──────▼──────┐   ┌────────▼────────┐
           │   Auth DB   │   │   Powens DB     │
           │  MongoDB    │   │   MongoDB       │
           │  (local)    │   │   (local)       │
           └─────────────┘   └─────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   Powens API    │
                              │  (3rd-party)    │
                              └─────────────────┘
```

| Service | Dev | Prod | Description |
|---|---|---|---|
| `frontend` | :5173 (Vite) | :80 (nginx) | Interface React |
| `auth-api` | :3001 | :3001 | Authentification et gestion utilisateurs |
| `powens-api` | :3003 | :3003 | Proxy vers l'API bancaire Powens |
| `auth-db` | — | — | MongoDB (réseau interne, données locales) |
| `powens-db` | — | — | MongoDB (réseau interne, données locales) |

> ⚠️ Les bases de données sont **locales à chaque machine**. Les données ne sont pas partagées entre machines. Voir [Base de données](#base-de-données) pour héberger sur MongoDB Atlas.

---

## Prérequis

- [Docker](https://www.docker.com/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2+

---

## Mode développement (avec le code source)

### 1. Cloner et configurer l'environnement

```bash
git clone <repo-url>
cd Project_test
cp .env.example .env
```

Éditez `.env` avec vos valeurs (voir section [Variables d'environnement](#variables-denvironnement)).

### 2. Lancer

```bash
docker compose up -d
```

### 3. Accéder à l'application

```
http://localhost:5173
```

> Le frontend tourne avec Vite (hot reload). Les modifications de code sont reflétées instantanément.

### 4. Demo (mode sandbox)

Lors de la connexion bancaire, sélectionnez **Demo Institution** — n'importe quel identifiant/mot de passe fonctionne.

---

## Mode production (depuis Docker Hub)

Aucun code source nécessaire — seulement `docker-compose.prod.yaml` + `.env`.

### 1. Récupérer les fichiers

```bash
mkdir budgetapp && cd budgetapp
# Copier docker-compose.prod.yaml et .env dans ce dossier
```

### 2. Lancer

```bash
docker compose -f docker-compose.prod.yaml pull   # télécharge les images depuis Docker Hub
docker compose -f docker-compose.prod.yaml up -d  # démarre tout
```

### 3. Accéder à l'application

```
http://localhost
```

> Le frontend est servi par nginx sur le port 80.

---

## Publier sur Docker Hub

```bash
# Se connecter
docker login

# Builder les images de production
docker compose build

# Pousser sur Docker Hub
docker compose push
```

Les images publiées :
- `<user>/budget-auth-api:latest`
- `<user>/budget-powens-api:latest`
- `<user>/budget-frontend:latest`

Pour versionner :
```bash
# Dans .env : IMAGE_TAG=v1.0.0
docker compose build && docker compose push
```

---

## Variables d'environnement

Copiez `.env.example` en `.env` et remplissez les valeurs :

```ini
# ── MongoDB Auth ──────────────────────────────────────────────────────────
AUTH_DB_USER=auth_user
AUTH_DB_PASSWORD=changeme_auth
AUTH_DB_NAME=auth_db

# ── MongoDB Powens ────────────────────────────────────────────────────────
POWENS_DB_USER=powens_user
POWENS_DB_PASSWORD=changeme_powens
POWENS_DB_NAME=powens_db

# ── JWT ───────────────────────────────────────────────────────────────────
# Générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-byte-hex-secret>
JWT_EXPIRES_IN=7d

# ── Powens API ────────────────────────────────────────────────────────────
POWENS_CLIENT_ID=<your-client-id>
POWENS_CLIENT_SECRET=<your-client-secret>
POWENS_BASE_URL=https://gestionpatrimoine-esilv-sandbox.biapi.pro/2.0
POWENS_WEBVIEW_URL=https://webview.powens.com/connect

# ── URLs ──────────────────────────────────────────────────────────────────
CALLBACK_URL=http://localhost:3003/api/powens/callback
FRONTEND_URL=http://localhost:5173   # dev uniquement

# ── Docker Hub ────────────────────────────────────────────────────────────
DOCKER_HUB_USER=yourdockerhubusername
IMAGE_TAG=latest

# ── Frontend API URLs (baked in at build time) ────────────────────────────
# Nécessaire uniquement si déploiement sur un serveur distant
# VITE_AUTH_API_URL=http://<ip-serveur>:3001
# VITE_POWENS_API_URL=http://<ip-serveur>:3003
```

> ⚠️ Ne commitez jamais le fichier `.env`. Il est listé dans `.gitignore`.

---

## Base de données

Les bases MongoDB tournent localement dans des volumes Docker. **Les données ne sont pas partagées entre machines.**

Pour une base commune à toutes les machines, utilisez **MongoDB Atlas** (gratuit jusqu'à 512 MB) :

1. Créez un cluster sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Récupérez l'URI de connexion
3. Dans `.env`, remplacez :
```ini
# Auth
AUTH_DB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/auth_db
# Powens
POWENS_DB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/powens_db
```
4. Supprimez les services `auth-db` et `powens-db` du `docker-compose.prod.yaml`

---

## API Reference

### Auth API — `localhost:3001`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Créer un compte (`email`, `password` ≥ 8 chars) |
| `POST` | `/auth/login` | — | Se connecter, retourne un JWT |
| `GET` | `/auth/me` | JWT | Infos de l'utilisateur courant |
| `GET` | `/health` | — | Health check |

### Powens API — `localhost:3003`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/powens/init` | JWT | Démarre la connexion bancaire, retourne l'URL WebView |
| `GET` | `/api/powens/callback` | — | Callback Powens après autorisation |
| `GET` | `/api/powens/accounts` | JWT | Liste des comptes bancaires |
| `GET` | `/api/powens/transactions?limit=50` | JWT | Toutes les transactions (max 200) |
| `GET` | `/api/powens/accounts/:id/transactions` | JWT | Transactions d'un compte |
| `GET` | `/api/powens/accounts/:id/investments` | JWT | Portefeuille d'un compte |
| `GET` | `/health` | — | Health check |

---

## Flux utilisateur

```
1. Inscription / Connexion  →  JWT stocké dans localStorage
2. Dashboard                →  Affiche le total du portefeuille
3. Connexion bancaire       →  Redirection vers le WebView Powens
4. Autorisation banque      →  Callback → comptes disponibles
5. Comptes                  →  Liste groupée (Savings / Livrets / Investissements)
6. Détail compte            →  Transactions ou holdings selon le type
```

---

## Structure du projet

```
Project_test/
├── api1/                  # Auth API (Node.js/Express)
│   ├── src/
│   │   ├── index.js       # Point d'entrée + routes
│   │   └── middleware.js  # Vérification JWT
│   └── Dockerfile
│
├── api2/                  # Powens API (Node.js/Express)
│   ├── src/
│   │   ├── index.js       # Point d'entrée + routes
│   │   └── powens.js      # Client Powens API
│   └── Dockerfile
│
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── App.jsx        # Routes React Router
│   │   ├── App.css        # Styles des composants
│   │   ├── index.css      # Variables CSS (thème clair/sombre)
│   │   ├── api/           # Clients Axios
│   │   └── pages/         # Login, Register, Dashboard, Accounts, Transactions
│   └── Dockerfile         # 3 stages : development / build / production (nginx)
│
├── docker-compose.yaml        # Dev (Vite, hot reload, port 5173)
├── docker-compose.prod.yaml   # Prod (images Docker Hub, nginx, port 80)
├── .env.example
└── README.md
```

---

## Commandes utiles

```bash
# ── Développement ─────────────────────────────────────────────────────────
docker compose up -d                        # Lancer
docker compose logs -f                      # Logs en temps réel
docker compose logs -f frontend             # Logs d'un service
docker compose restart powens-api           # Redémarrer un service
docker compose down                         # Arrêter
docker compose down -v                      # Arrêter + supprimer les volumes
docker compose build --no-cache             # Rebuild les images

# ── Production (Docker Hub) ───────────────────────────────────────────────
docker compose -f docker-compose.prod.yaml pull    # Télécharger les images
docker compose -f docker-compose.prod.yaml up -d   # Lancer
docker compose -f docker-compose.prod.yaml ps      # Statut
docker compose -f docker-compose.prod.yaml logs -f # Logs
docker compose -f docker-compose.prod.yaml down     # Arrêter

# ── Publier sur Docker Hub ────────────────────────────────────────────────
docker login
docker compose build
docker compose push
```

---

## Sécurité

- Mots de passe hashés avec **bcryptjs** (12 rounds)
- Authentification stateless via **JWT** (Bearer token)
- Rate limiting sur les routes d'auth : **50 requêtes / 15 min**
- Conteneurs en **utilisateur non-root**
- Réseaux Docker isolés : la base Auth n'est pas accessible depuis le réseau Powens
- CORS configuré à l'origine exacte du frontend (`http://localhost` en prod)

---

## Tech Stack

| Couche | Technologie |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Backend | Node.js 22, Express 4 |
| Base de données | MongoDB 7 |
| Auth | JWT, bcryptjs |
| Conteneurisation | Docker, Docker Compose |
| Serveur web (prod) | nginx 1.27 |
| Intégration bancaire | Powens / Biapi Pro (sandbox) |
