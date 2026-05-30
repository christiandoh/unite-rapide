<div align="center">
  <img src="ussd_executor_app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" alt="Unité Rapide" width="120" height="120" />
  
  # Unité Rapide
  
  **Plateforme d'automatisation USSD — Côte d'Ivoire**
  
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Flutter-3.24-02569B?logo=flutter" alt="Flutter" />
    <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis" alt="Redis" />
    <img src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Kotlin-Android-7F52FF?logo=kotlin" alt="Kotlin" />
    <br/>
    <img src="https://img.shields.io/badge/licence-priv%C3%A9e-red" alt="Licence" />
    <img src="https://img.shields.io/badge/statut-production_ready-brightgreen" alt="Statut" />
  </p>
</div>

---

## ✨ Aperçu

**Unité Rapide** est une plateforme complète de souscription de services mobiles qui permet aux utilisateurs d'acheter des forfaits internet et crédit (Orange, MTN, Moov), payer via **Wave Business**, et activer automatiquement les services via des codes USSD exécutés sur des **téléphones Android physiques**.

### 🎯 Fonctionnalités clés

| | Fonctionnalité | Détail |
|---|---|---|
| 🛒 | **Catalogue** | Parcourez et achetez des forfaits multi-opérateurs |
| 💳 | **Paiement Wave** | Générez des liens de paiement et QR codes |
| 🤖 | **Validation IA** | OCR + analyse d'image pour valider les preuves |
| 📱 | **Execution USSD** | Codes USSD exécutés automatiquement sur Android |
| ⚡ | **Temps réel** | Statut des commandes via WebSocket |
| 📊 | **Dashboard admin** | Statistiques, validation manuelle, gestion |
| 🔄 | **File d'attente** | Gestion des tâches USSD avec priorisation |

---

## 🏗 Architecture

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
           │  React   │ │  React   │ │Express   │
           └──────────┘ └──────────┘ └────┬─────┘
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

## 🧩 Services

| Service | Stack | Rôle | Port |
|---|---|---|---|
| **backend-api** | Node 20, Express, Prisma, Bull | API REST | `3000` |
| **frontend-web** | React 18 (CRA) | Interface client | `80` (via nginx) |
| **admin-dashboard** | React 18 (CRA), Recharts | Administration | `80` (via nginx) |
| **ia-validator** | Python 3.11, FastAPI, Tesseract | Validation IA | `8000` |
| **websocket-server** | Node, Socket.io, Redis | Temps réel | `8080` |
| **ussd_executor_app** | Flutter, Kotlin | Execution USSD | (mobile) |
| **postgres** | PostgreSQL 15 | Base de données | `5432` |
| **redis** | Redis 7 | Cache + Queue | `6379` |

## 🚀 Démarrage

### Prérequis

- Node.js 20+, Python 3.11+, Flutter 3.24+
- Docker / Podman (pour PostgreSQL et Redis)
- Téléphone Android (API 24+) pour l'exécution USSD

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/christiandoh/unite-rapide.git
cd unite-rapide

# 2. Configurer l'environnement
cp .env.example .env
# Remplir : POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, WAVE_MERCHANT_CODE

# 3. Lancer les services
docker compose up -d postgres redis

# 4. Initialiser la base de données
cd backend-api && npm install && npx prisma generate && npx prisma db push && npm run seed && cd ..

# 5. Lancer le backend
cd backend-api && npm start &

# 6. Lancer le frontend
cd frontend-web && npm install && npm start &

# 7. Lancer l'application mobile
cd ussd_executor_app && flutter run
```

### Identifiants par défaut

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| **Admin** | `0711118582` | `Hacker@117` |
| **Utilisateur** | `christiandoh29@gmail.com` | `Hacker@117` |

## 📱 Captures d'écran

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Landing page</strong></td>
      <td align="center"><strong>Catalogue</strong></td>
      <td align="center"><strong>Dashboard admin</strong></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/280x500/1a1a2e/ffffff?text=Unite+Rapide" width="250" /></td>
      <td><img src="https://via.placeholder.com/280x500/1a1a2e/ffffff?text=Catalogue" width="250" /></td>
      <td><img src="https://via.placeholder.com/280x500/ffffff/000000?text=Admin+Dashboard" width="250" /></td>
    </tr>
  </table>
</div>

## 🔄 Flux utilisateur

```
1️⃣  Parcourir le catalogue → Choisir un forfait
        ↓
2️⃣  Paiement via Wave Business (lien ou QR code)
        ↓
3️⃣  Upload de la capture d'écran de paiement
        ↓
4️⃣  Validation IA automatique (OCR + analyse)
        ↓
5️⃣  Code USSD exécuté sur téléphone Android
        ↓
6️⃣  Confirmation reçue en temps réel (WebSocket)
```

## 📖 API

### Routes principales

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion |
| `POST` | `/api/auth/register` | Inscription |
| `GET` | `/api/services` | Catalogue |
| `POST` | `/api/commandes` | Créer une commande |
| `POST` | `/api/paiement/upload-proof` | Upload preuve |
| `GET` | `/api/admin/dashboard` | Stats admin |
| `POST` | `/api/admin/ussd/executer` | Execution USSD |
| `POST` | `/api/admin/ussd/test` | Test USSD libre |
| `POST` | `/api/phone/lookup` | Enregistrement téléphone |

### Statuts de commande

```
en_attente_paiement → paiement_soumis → paiement_valide → en_cours_execution → execute
                                        ↘ a_reviser ↘ paiement_rejete
                                                                    ↘ echoue
```

## 📦 Structure du projet

```
unite-rapide/
├── backend-api/          # API REST (Node.js, Express, Prisma)
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── routes/       # Définition des routes
│   │   ├── jobs/         # Files Bull (execution USSD)
│   │   ├── services/     # Résultat USSD consumer
│   │   ├── middleware/    # Auth, validation, upload
│   │   └── config/       # Prisma, logger, Redis
│   └── prisma/           # Schéma BDD + seed
├── frontend-web/         # Interface client (React)
│   └── src/
│       ├── pages/        # Pages principales
│       ├── components/   # Composants réutilisables
│       └── services/     # API client
├── admin-dashboard/      # Panneau admin (React)
├── websocket-server/     # Serveur temps réel (Socket.io)
├── ia-validator/         # Validation IA (Python, FastAPI)
├── ussd_executor_app/    # App Android (Flutter, Kotlin)
└── nginx/                # Configuration nginx
```

## 🔒 Sécurité

- ✅ **HTTPS** avec certificat Let's Encrypt
- ✅ **Headers de sécurité** (HSTS, X-Frame-Options, CSP)
- ✅ **Rate limiting** nginx (auth, API, upload)
- ✅ **Firewall UFW** (ports 22, 80, 443)
- ✅ **Wake Lock** Android pendant l'exécution USSD
- ✅ **Tokens JWT** avec refresh
- ✅ **Validation Joi** des entrées
- ✅ **Transactions Prisma** pour les opérations critiques
- ✅ **Idempotence** des commandes

## 🛠 Maintenance

### Sauvegarde

```bash
# Sauvegarde manuelle
./backup.sh

# Sauvegarde automatique (tous les jours à 3h)
# Configurée via cron
```

### Healthcheck

```bash
# Vérification de tous les services
./healthcheck.sh

# Exécuté automatiquement toutes les 10 minutes
```

### Mise à jour

```bash
git pull
cd backend-api && npm install
cd frontend-web && npm install && npm run build
cd admin-dashboard && npm install && npm run build
sudo systemctl restart unite-backend unite-websocket
```

## 📄 Licence

Projet privé — Tous droits réservés.

---

<div align="center">
  <p>
    <strong>Unié Rapide</strong> — <em>Automatisation de souscription USSD</em><br/>
    Côte d'Ivoire 🇨🇮
  </p>
</div>
