# Unité Rapide — USSD Automation Platform

**Automatisation de souscription de services mobiles (Côte d'Ivoire).**

Plateforme multi-service qui permet aux utilisateurs d'acheter des forfaits internet et crédit, payer via Wave Business, valider les paiements par IA, et exécuter les codes USSD sur des téléphones Android physiques.

## Architecture

```
                     ┌─────────────┐
                     │   Nginx     │ :80/:443
                     │   Proxy     │
                     └─────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Frontend │ │  Admin   │ │ Backend  │
       │   Web    │ │Dashboard │ │   API    │
       │  :80(*/) │ │ :80(/admin)│ │ :3000    │
       └──────────┘ └──────────┘ └────┬─────┘
              │                        │
              └────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────┐
                    ▼                  ▼              ▼
             ┌──────────┐      ┌──────────┐    ┌──────────┐
             │    IA    │      │    WS    │    │PostgreSQL│
             │Validator │      │  Server  │    │  + Redis │
             │  :8000   │      │  :8080   │    │          │
             └──────────┘      └────┬─────┘    └──────────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │   Android    │
                             │    Phone     │
                             │  (USSD exec) │
                             └──────────────┘
```

## Services

| Service | Technologie | Rôle |
|---|---|---|
| **backend-api** | Node 20, Express, Prisma, Bull | API REST (auth, services, commandes, paiement, admin, webhook) |
| **frontend-web** | React 18 (CRA), Socket.io client | Interface client (catalogue, paiement, suivi) |
| **admin-dashboard** | React 18 (CRA), Recharts | Panneau d'administration (statistiques, validation) |
| **ia-validator** | Python 3.11, FastAPI, Tesseract OCR | Validation IA des captures de paiement |
| **websocket-server** | Node, Socket.io, Redis pub/sub | Bridge temps réel entre Android et navigateurs |
| **ussd_executor_app** | Flutter, Kotlin (Accessibility Service) | Exécution USSD sur téléphone Android |
| **nginx-proxy** | nginx:alpine | Reverse proxy, SSL, routage |
| **postgres** | PostgreSQL 15 | Base de données principale |
| **redis** | Redis 7 | Cache, files d'attente Bull, sessions WebSocket |

## Démarrage rapide

```bash
cp .env.example .env
# Remplir les variables requises :
#   POSTGRES_PASSWORD, REDIS_PASSWORD,
#   JWT_SECRET, JWT_REFRESH_SECRET, WAVE_MERCHANT_CODE

./setup.sh
```

L'API est disponible sur `http://localhost:3000`, le frontend sur `http://localhost`, et l'admin sur `http://localhost/admin`.

### Identifiants admin par défaut

```
Téléphone : 0700000000
Mot de passe : admin123
```

### Prérequis

- Docker & Docker Compose
- Pour l'application Android : Flutter SDK + un appareil Android (API 24+)

## Variables d'environnement

| Variable | Requise | Défaut | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | — | Mot de passe PostgreSQL |
| `REDIS_PASSWORD` | ✅ | — | Mot de passe Redis |
| `JWT_SECRET` | ✅ | — | Clé secrète JWT |
| `JWT_REFRESH_SECRET` | ✅ | — | Clé secrète refresh JWT |
| `WAVE_MERCHANT_CODE` | ✅ | — | Code marchand Wave Business |
| `POSTGRES_USER` | ❌ | `ussd_admin` | Utilisateur PostgreSQL |
| `POSTGRES_DB` | ❌ | `ussd_automation` | Nom de la base |
| `CORS_ORIGIN` | ❌ | `https://ussd-automation.com` | Origine CORS |
| `IA_CONFIDENCE_THRESHOLD` | ❌ | `0.85` | Seuil de confiance IA |

## Flux utilisateur

```
1. Client parcourt le catalogue → choisit un forfait
2. Paiement via lien Wave Business (QR code)
3. Client upload la capture d'écran de paiement
4. IA valide automatiquement la capture (OCR + fraude)
5. USSD programmé et exécuté sur un téléphone Android
6. Client reçoit la confirmation en temps réel (WebSocket)
```

## Commandes par service

### backend-api
```bash
npm run dev          # Serveur de développement (nodemon)
npm run migrate      # Migration production
npm run migrate:dev  # Migration développement
npm run generate     # Générer client Prisma
npm run seed         # Peupler la base
npm run test         # Tests unitaires (Jest + supertest)
```

### frontend-web / admin-dashboard
```bash
npm start            # Serveur de développement
npm run build        # Build production
npm test             # Tests (React Testing Library)
```

### ia-validator
- Documentation auto-générée : `http://localhost:8000/docs`
- Tesseract OCR avec pack français (`tesseract-ocr-fra`)

### ussd_executor_app
```bash
flutter run          # Lancer sur appareil connecté
flutter test         # Tests
```

## Réseaux Docker

| Réseau | Type | Services |
|---|---|---|
| `frontend_network` | bridge (externe) | Nginx, backend, frontend-web, admin-dashboard, WS |
| `backend_network` | bridge (interne) | backend, IA, PostgreSQL, Redis |
| `phone_network` | bridge (interne) | WS, téléphones Android |

## API

### Points d'entrée

| Route | Description |
|---|---|
| `/api/auth/*` | Authentification (inscription, connexion, refresh) |
| `/api/services/*` | Catalogue des forfaits |
| `/api/commandes/*` | Gestion des commandes |
| `/api/paiement/*` | Paiement Wave et upload de capture |
| `/api/admin/*` | Administration (utilisateurs, statistiques) |
| `/api/webhook/*` | Webhooks externes |

### Statuts de commande

| Statut | Signification |
|---|---|
| `en_attente_paiement` | En attente du paiement |
| `paiement_valide` | Paiement confirmé par l'IA |
| `en_cours_execution` | USSD en cours d'exécution |
| `a_reviser` | Nécessite une vérification manuelle |

## Conventions

- Les réponses API sont en **français**
- Format téléphone ivoirien : `^(07\|05\|01)\d{8}$`
- Formats d'image acceptés : `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif` (max 10 Mo)
- Le backend utilise CommonJS (`require`)
- Les applications React utilisent des composants fonctionnels + hooks
- Flutter utilise Provider (state) et GetIt (DI)

## Licence

Projet privé — Tous droits réservés.
