# USSD Automation Platform — Agent Guide

## What this is

Multi-service Docker platform for mobile service subscription (Côte d'Ivoire). Users buy internet/credit packages, pay via Wave Business links, upload screenshots for AI validation, and USSD codes execute on physical Android phones.

## Services & directories

| Directory | Service | Stack | Port |
|---|---|---|---|
| `backend-api/` | REST API | Node 20, Express, Prisma, PostgreSQL, Redis (Bull) | 3000 |
| `frontend-web/` | Customer frontend | React 18 (CRA), Socket.io client | 80 (via nginx) |
| `admin-dashboard/` | Admin panel | React 18 (CRA), Recharts | 80 (via nginx) |
| `ia-validator/` | AI payment validation | Python 3.11, FastAPI, Tesseract OCR, OpenCV | 8000 |
| `websocket-server/` | Real-time bridge | Node, Socket.io (namespaces: `/phones`, `/web`), Redis pub/sub | 8080 |
| `ussd_executor_app/` | Android USSD executor | Flutter, Kotlin native bridge (accessibility service) | (mobile) |

**Entrypoints:**
- `backend-api/src/server.js` (boots Prisma + Redis, then HTTP)
- `backend-api/src/app.js` (Express app, routes: `/api/auth|services|commandes|paiement|admin|webhook`)
- `ia-validator/main.py` (FastAPI app, `/validate/payment`, `/validate/status/{id}`, `/health`)
- `websocket-server/src/server.js` (Socket.io with phone auth via Redis token)
- `frontend-web/src/index.jsx` / `admin-dashboard/src/index.jsx` (CRA)
- `ussd_executor_app/lib/main.dart` (Flutter)

## Setup

```bash
cp .env.example .env   # fill in all required secrets
./setup.sh             # builds Docker images, starts services, runs Prisma migrate + seed
```

**Required vars** (no defaults): `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `WAVE_MERCHANT_CODE`.

Default admin credentials: `0700000000 / admin123`.

## Key commands (per service)

### backend-api (`npm` scripts):
- `npm run dev` — nodemon with file watching (not `node src/server.js`)
- `npm run migrate` — `prisma migrate deploy` (production)
- `npm run migrate:dev` — `prisma migrate dev` (dev, creates migration files)
- `npm run generate` — `prisma generate` (postinstall hook)
- `npm run seed` — `node prisma/seed.js`
- `npm run studio` — `prisma studio` (DB browser on :5555)
- `npm run test` — `jest --coverage`
- **Order matters**: after pulling, run `npm run generate` then `npm run migrate` (or `migrate:dev`)

### frontend-web / admin-dashboard (`npm` scripts):
- `npm start` — `react-scripts start` (dev server with proxy to `http://backend-api:3000`)
- `npm run build` — `react-scripts build` (static output to `build/`)
- `npm test` — `react-scripts test`

### ia-validator:
- Run via Docker (no local Python required, venv exists but is unreliable)
- FastAPI auto-docs at `http://localhost:8000/docs`
- Tesseract OCR with French language pack (`tesseract-ocr-fra`)

### websocket-server:
- `npm run dev` — nodemon (no test/lint scripts configured)

### ussd_executor_app:
- `flutter run` (requires Android device/emulator with accessibility service)
- `flutter test`

## Docker infra

```bash
docker compose up -d                    # start all services
docker compose build                    # rebuild
docker compose exec backend-api npx prisma migrate dev --name init   # fresh migrations
```

**Multi-stage Dockerfiles** (backend-api, frontend-web, admin-dashboard use build stages). The nginx-proxy uses `nginx:alpine` image directly.

## Architecture quirks

- **3 isolated Docker networks**: `frontend_network` (front+API), `backend_network` (internal: API+IA+DB+Redis), `phone_network` (internal: WS+phones)
- **Prisma migrations are gitignored** (`backend-api/prisma/migrations/`). Must generate fresh on new clone.
- **Wave Business**: no official API integration — just generates payment links (`https://pay.wave.com/m/{CODE}/{amount}`) with QR codes.
- **Bull queue** (Redis-backed) for USSD task scheduling with rate limiting (max 2 concurrent tasks per phone).
- **Redis caching** via Prisma `$extends` query middleware (60s TTL, model-level cache invalidation on writes).
- **WebSocket dual namespace**: `/phones` (Android executor auth via token in Redis), `/web` (browsers subscribe to commande status).
- **Nginx routes**: `/` → frontend-web, `/admin/` → admin-dashboard, `/api/` → backend-api, `/ws/` → websocket-server
- **Client max body**: nginx = 20MB, backend = 1MB (Express `json` limit)
- **Phone auth token** stored in Redis key `phone:token:{token}`, set during phone registration.

## Testing

- Backend: `npm test` in `backend-api/` (Jest + supertest, coverage enabled)
- Frontend: `npm test` in `frontend-web/` (react-scripts test, Jest + Testing Library)
- Flutter: `flutter test` in `ussd_executor_app/`
- IA Validator: `tests/` dir (likely pytest, no script wrapper yet)
- **No e2e or integration test setup** exists.

## Style & conventions

- API responses are in **French** (error messages, field names, status labels)
- Status enums use French snake_case: `"en_attente_paiement"`, `"paiement_valide"`, `"en_cours_execution"`, `"a_reviser"`
- Ivorian phone format: `/^(07|05|01)\d{8}$/`
- Image validation formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif` (max 10MB)
- Prisma models use `@@map("tables_name_fr")` with `@map` for field names
- Backend code is CommonJS (`require`, not ESM imports)
- React apps use functional components with hooks (no classes)
- Flutter uses Provider for state, GetIt for DI
- Git: `.env`, `uploads/`, `logs/`, `nginx/ssl/`, `backend-api/prisma/migrations/` are gitignored

## Gotchas

- **Do not run Prisma commands outside Docker** unless you set `DATABASE_URL` locally.
- **Flutter app** requires Android Accessibility Service permission to dial USSD codes — must be enabled manually on device.
- The `ia-validator/venv/` is local-only; the Docker image installs deps from `requirements.txt`.
- **SSL certs** go in `nginx/ssl/` (gitignored; ACME challenge via `/var/www/certbot`). For dev, generate self-signed: `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem -subj "/C=CI/O=Dev"`.
- **No CI/CD** configured (no `.github/` workflows).
- **Bull queue jobs**: `expirationJob.js` (cleanup expired orders) and `retryJob.js` (retry failed USSD tasks) run as part of backend.
- **Known Docker build issues** (all fixed, but watch for regressions):

  | Symptom | Root cause | Fix |
  |---|---|---|
  | `libgl1-mesa-glx` not found | Renamed to `libgl1` in Debian trixie | Use `libgl1` in `ia-validator/Dockerfile` |
  | `npm ci` fails on lockfile | `package-lock.json` out of sync with `package.json` | Delete lockfile, run `npm install` |
  | Backend crashes at startup | `node_modules/` from macOS host overwrites Linux one via `COPY . .` | Add `.dockerignore` with `node_modules/` to every Node service |
  | Backend segfault on `require('bcrypt')` | `bcrypt_lib.node` compiled for macOS (Mach-O) instead of Linux (ELF) | Same fix as above — missing `.dockerignore` |
  | Prisma `$extends` or `$on` throws | `PrismaClient.prototype.$extends` doesn't exist; `$on` unavailable after `$extends` | Call `$extends` on instance; attach `$on` to base client before extending |
  | `EACCES: mkdir '/app/logs'` | `USER node` but `/app/logs` not created | `mkdir -p /app/logs && chown node:node` in Dockerfile before `USER` |
  | Backend base image: Prisma+OpenSSL mismatch | `node:20-alpine` musl libc incompatible with Prisma engine | Switch to `node:20-slim` (Debian/glibc) |
  | Nginx `host not found in upstream` | Container not on correct Docker network | `websocket-server` needs `frontend_network` in compose |
  | IA validator `Read-only file system` | `uploads` volume mounted `:ro` | Remove `:ro` from compose volume mount |
  | Nginx can't load SSL cert | `nginx/ssl/` empty (gitignored) | Generate self-signed certs for dev |
