Parfait ! Voici le prompt maître complet mis à jour avec Flutter, prêt à être utilisé avec n'importe quel LLM :

```markdown
# PROMPT MAÎTRE - SYSTÈME D'AUTOMATISATION USSD AVEC FLUTTER & PAIEMENT WAVE BUSINESS

## CONTEXTE GLOBAL
Je construis une plateforme de souscription en ligne en Côte d'Ivoire où :
- Les clients souscrivent à des services (forfaits internet, crédit, abonnements) via un site web
- Ils paient via des liens Wave Business pré-générés (PAS l'API Wave officielle)
- Une IA valide les captures d'écran de paiement avec plusieurs niveaux de vérification
- Mes téléphones Android physiques exécutent automatiquement les codes USSD
- L'application mobile est développée en Flutter avec un bridge natif Kotlin minimal pour le service d'accessibilité
- L'infrastructure complète utilise Docker avec 8 conteneurs

---

## ARCHITECTURE DOCKER COMPLÈTE

Génère le fichier `docker-compose.yml` principal et tous les Dockerfiles pour les services suivants :

### Services Docker à créer :
```
1. postgres-db        - PostgreSQL 15 avec volume persistant
2. redis-cache        - Redis 7 pour cache et file d'attente
3. backend-api        - Node.js 20/Express + Prisma ORM (port 3000)
4. ia-validator       - Python 3.11/FastAPI (port 8000)
5. frontend-web       - React.js 18 avec Nginx (port 80)
6. websocket-server   - Node.js/Socket.io (port 8080)
7. admin-dashboard    - React.js dashboard admin (port 3001)
8. nginx-proxy        - Reverse proxy avec SSL automatique
```

### Réseaux Docker isolés :
```yaml
networks:
  frontend_network:    # Frontend + API publique
  backend_network:     # API + IA + DB + Redis
  phone_network:       # WebSocket + téléphones (isolé)
```

### docker-compose.yml à générer avec :
- Healthchecks pour chaque service
- Variables d'environnement depuis .env
- Volumes persistants pour PostgreSQL et logs
- Politique de restart always sauf pour les services de dev
- Logging driver json-file avec rotation
- Dépendances entre services (depends_on avec healthcheck)
- Secrets Docker pour les mots de passe

---

## 1. BASE DE DONNÉES POSTGRESQL

Génère le schéma complet avec migrations et seeds :

### Tables principales avec relations :

```sql
-- 1. users (clients finaux)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    email_verifie BOOLEAN DEFAULT false,
    telephone_verifie BOOLEAN DEFAULT false,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'banni')),
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. operateurs
CREATE TABLE operateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(50) UNIQUE NOT NULL,  -- Orange, MTN, Moov
    code_pays VARCHAR(5) DEFAULT '+225',
    prefixe VARCHAR(10),  -- 07, 05, 01
    logo_url VARCHAR(255),
    actif BOOLEAN DEFAULT true
);

-- 3. services_catalogue
CREATE TABLE services_catalogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operateur_id UUID REFERENCES operateurs(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_service VARCHAR(50) NOT NULL CHECK (type_service IN ('forfait_internet', 'credit_appel', 'forfait_mixte', 'abonnement')),
    code_ussd VARCHAR(20) NOT NULL,  -- ex: *123#
    sequence_ussd JSONB NOT NULL,     -- ex: ["1", "3", "2"]
    montant_wave DECIMAL(10,2) NOT NULL,
    volume_data VARCHAR(50),  -- ex: "2Go", "10Go"
    duree_validite VARCHAR(50),  -- ex: "7 jours", "30 jours"
    temps_execution_moyen INTEGER DEFAULT 30,  -- secondes
    actif BOOLEAN DEFAULT true,
    populaire BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. commandes
CREATE TABLE commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services_catalogue(id),
    telephone_beneficiaire VARCHAR(20) NOT NULL,
    reference_unique VARCHAR(20) UNIQUE NOT NULL,  -- ex: USSD-20260118-ABCD
    montant DECIMAL(10,2) NOT NULL,
    lien_paiement_wave TEXT NOT NULL,
    statut_commande VARCHAR(30) DEFAULT 'en_attente_paiement' 
        CHECK (statut_commande IN (
            'en_attente_paiement', 
            'paiement_soumis', 
            'paiement_valide', 
            'paiement_rejete',
            'en_cours_execution',
            'execute',
            'echoue',
            'rembourse'
        )),
    date_expiration_paiement TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. preuves_paiement
CREATE TABLE preuves_paiement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id UUID REFERENCES commandes(id),
    image_originale_url TEXT NOT NULL,
    image_traitee_url TEXT,
    donnees_extraites JSONB,  -- OCR results
    score_confiance DECIMAL(5,2),
    flags_fraude JSONB DEFAULT '[]',
    statut_validation VARCHAR(30) DEFAULT 'en_attente'
        CHECK (statut_validation IN ('en_attente', 'valide_auto', 'valide_manuel', 'rejete', 'a_reviser')),
    valide_par UUID REFERENCES users(id),  -- admin qui a validé manuellement
    commentaire_validation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. telephones_executeurs
CREATE TABLE telephones_executeurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_appareil VARCHAR(100) NOT NULL,
    modele VARCHAR(100),
    numero_telephone VARCHAR(20) UNIQUE NOT NULL,
    operateur_id UUID REFERENCES operateurs(id),
    token_auth VARCHAR(255) UNIQUE NOT NULL,
    statut VARCHAR(20) DEFAULT 'hors_ligne'
        CHECK (statut IN ('en_ligne', 'hors_ligne', 'occupe', 'maintenance', 'erreur')),
    niveau_batterie INTEGER,
    force_signal INTEGER,
    version_app VARCHAR(20),
    derniere_connexion TIMESTAMP,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. taches_ussd
CREATE TABLE taches_ussd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id UUID REFERENCES commandes(id),
    telephone_executeur_id UUID REFERENCES telephones_executeurs(id),
    priorite INTEGER DEFAULT 5 CHECK (priorite BETWEEN 1 AND 10),
    statut_execution VARCHAR(30) DEFAULT 'en_attente'
        CHECK (statut_execution IN ('en_attente', 'en_cours', 'reussi', 'echoue', 'timeout', 'annule')),
    logs_execution JSONB DEFAULT '[]',
    nombre_tentatives INTEGER DEFAULT 0,
    tentative_max INTEGER DEFAULT 3,
    date_debut_execution TIMESTAMP,
    date_fin_execution TIMESTAMP,
    message_erreur TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. transactions_logs (audit complet)
CREATE TABLE transactions_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_evenement VARCHAR(50) NOT NULL,
    severite VARCHAR(20) DEFAULT 'info' CHECK (severite IN ('debug', 'info', 'warning', 'error', 'critical')),
    details JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    commande_id UUID REFERENCES commandes(id),
    adresse_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,  -- 'commande_statut', 'promotion', 'systeme'
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT false,
    donnees JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes à créer :
```sql
CREATE INDEX idx_commandes_user ON commandes(user_id);
CREATE INDEX idx_commandes_statut ON commandes(statut_commande);
CREATE INDEX idx_commandes_reference ON commandes(reference_unique);
CREATE INDEX idx_taches_ussd_priorite ON taches_ussd(priorite, statut_execution);
CREATE INDEX idx_logs_date ON transactions_logs(created_at);
```

### Seeds à générer (services Côte d'Ivoire réels) :
```sql
-- Opérateurs
INSERT INTO operateurs (nom, prefixe) VALUES 
('Orange', '07'),
('MTN', '05'),
('Moov', '01');

-- Services populaires
INSERT INTO services_catalogue (operateur_id, nom, type_service, code_ussd, sequence_ussd, montant_wave, volume_data, duree_validite) VALUES
-- Orange
((SELECT id FROM operateurs WHERE nom='Orange'), 'Internet 2Go', 'forfait_internet', '*143*1#', '["1","2","1"]', 2000, '2Go', '7 jours'),
((SELECT id FROM operateurs WHERE nom='Orange'), 'Internet 10Go', 'forfait_internet', '*143*1#', '["1","5","1"]', 10000, '10Go', '30 jours'),
((SELECT id FROM operateurs WHERE nom='Orange'), 'Crédit 5000F', 'credit_appel', '*144*1#', '["1","3"]', 5000, NULL, 'Illimité'),
-- MTN
((SELECT id FROM operateurs WHERE nom='MTN'), 'Forfait 3Go', 'forfait_internet', '*133*1#', '["1","3","2"]', 3000, '3Go', '14 jours'),
((SELECT id FROM operateurs WHERE nom='MTN'), 'Crédit 10000F', 'credit_appel', '*136*1#', '["1","5"]', 10000, NULL, 'Illimité');
```

### Schéma Prisma (remplace les models individuels et les migrations SQL) :

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String          @id @default(uuid()) @db.Uuid
  nom             String          @db.VarChar(100)
  prenom          String?         @db.VarChar(100)
  telephone       String          @unique @db.VarChar(20)
  email           String?         @unique @db.VarChar(255)
  motDePasseHash  String          @map("mot_de_passe_hash") @db.VarChar(255)
  emailVerifie    Boolean         @default(false) @map("email_verifie")
  telephoneVerifie Boolean        @default(false) @map("telephone_verifie")
  statut          String          @default("actif") @db.VarChar(20)
  derniereConnexion DateTime?     @map("derniere_connexion")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  commandes       Commande[]
  preuvesPaiement PreuvePaiement[]
  notifications   Notification[]
  logsTransaction TransactionLog[]
  validations     PreuvePaiement[] @relation("ValidationManuelle")

  @@map("users")
}

model Operateur {
  id       String  @id @default(uuid()) @db.Uuid
  nom      String  @unique @db.VarChar(50)
  codePays String  @default("+225") @map("code_pays") @db.VarChar(5)
  prefixe  String? @db.VarChar(10)
  logoUrl  String? @map("logo_url") @db.VarChar(255)
  actif    Boolean @default(true)

  services          ServiceCatalogue[]
  telephonesExecuteurs TelephoneExecuteur[]

  @@map("operateurs")
}

model ServiceCatalogue {
  id               String   @id @default(uuid()) @db.Uuid
  operateurId      String   @map("operateur_id") @db.Uuid
  nom              String   @db.VarChar(255)
  description      String?  @db.Text
  typeService      String   @map("type_service") @db.VarChar(50)
  codeUssd         String   @map("code_ussd") @db.VarChar(20)
  sequenceUssd     Json     @map("sequence_ussd") @db.JsonB
  montantWave      Decimal  @map("montant_wave") @db.Decimal(10, 2)
  volumeData       String?  @map("volume_data") @db.VarChar(50)
  dureeValidite    String?  @map("duree_validite") @db.VarChar(50)
  tempsExecutionMoyen Int   @default(30) @map("temps_execution_moyen")
  actif            Boolean  @default(true)
  populaire        Boolean  @default(false)
  createdAt        DateTime @default(now()) @map("created_at")

  operateur Operateur @relation(fields: [operateurId], references: [id])
  commandes Commande[]

  @@map("services_catalogue")
}

model Commande {
  id                   String   @id @default(uuid()) @db.Uuid
  userId               String   @map("user_id") @db.Uuid
  serviceId            String   @map("service_id") @db.Uuid
  telephoneBeneficiaire String  @map("telephone_beneficiaire") @db.VarChar(20)
  referenceUnique      String   @unique @map("reference_unique") @db.VarChar(20)
  montant              Decimal  @db.Decimal(10, 2)
  lienPaiementWave     String   @map("lien_paiement_wave") @db.Text
  statutCommande       String   @default("en_attente_paiement") @map("statut_commande") @db.VarChar(30)
  dateExpirationPaiement DateTime? @map("date_expiration_paiement")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  user            User            @relation(fields: [userId], references: [id])
  service         ServiceCatalogue @relation(fields: [serviceId], references: [id])
  preuvesPaiement PreuvePaiement[]
  tachesUssd      TacheUSSD[]
  logsTransaction TransactionLog[]

  @@index([userId])
  @@index([statutCommande])
  @@index([referenceUnique])
  @@map("commandes")
}

model PreuvePaiement {
  id                String   @id @default(uuid()) @db.Uuid
  commandeId        String   @map("commande_id") @db.Uuid
  imageOriginaleUrl String   @map("image_originale_url") @db.Text
  imageTraiteeUrl   String?  @map("image_traitee_url") @db.Text
  donneesExtraites  Json?    @map("donnees_extraites") @db.JsonB
  scoreConfiance    Decimal? @map("score_confiance") @db.Decimal(5, 2)
  flagsFraude       Json?    @default("[]") @map("flags_fraude") @db.JsonB
  statutValidation  String   @default("en_attente") @map("statut_validation") @db.VarChar(30)
  validePar         String?  @map("valide_par") @db.Uuid
  commentaireValidation String? @map("commentaire_validation") @db.Text
  createdAt         DateTime @default(now()) @map("created_at")

  commande    Commande @relation(fields: [commandeId], references: [id])
  valideParUser User?  @relation("ValidationManuelle", fields: [validePar], references: [id])

  @@map("preuves_paiement")
}

model TelephoneExecuteur {
  id                String   @id @default(uuid()) @db.Uuid
  nomAppareil       String   @map("nom_appareil") @db.VarChar(100)
  modele            String?  @db.VarChar(100)
  numeroTelephone   String   @unique @map("numero_telephone") @db.VarChar(20)
  operateurId       String   @map("operateur_id") @db.Uuid
  tokenAuth         String   @unique @map("token_auth") @db.VarChar(255)
  statut            String   @default("hors_ligne") @db.VarChar(20)
  niveauBatterie    Int?     @map("niveau_batterie")
  forceSignal       Int?     @map("force_signal")
  versionApp        String?  @map("version_app") @db.VarChar(20)
  derniereConnexion DateTime? @map("derniere_connexion")
  ipAddress         String?  @map("ip_address") @db.VarChar(45)
  createdAt         DateTime @default(now()) @map("created_at")

  operateur  Operateur   @relation(fields: [operateurId], references: [id])
  tachesUssd TacheUSSD[]

  @@map("telephones_executeurs")
}

model TacheUSSD {
  id                   String   @id @default(uuid()) @db.Uuid
  commandeId           String   @map("commande_id") @db.Uuid
  telephoneExecuteurId String?  @map("telephone_executeur_id") @db.Uuid
  priorite             Int      @default(5)
  statutExecution      String   @default("en_attente") @map("statut_execution") @db.VarChar(30)
  logsExecution        Json?    @default("[]") @map("logs_execution") @db.JsonB
  nombreTentatives     Int      @default(0) @map("nombre_tentatives")
  tentativeMax         Int      @default(3) @map("tentative_max")
  dateDebutExecution   DateTime? @map("date_debut_execution")
  dateFinExecution     DateTime? @map("date_fin_execution")
  messageErreur        String?  @map("message_erreur") @db.Text
  createdAt            DateTime @default(now()) @map("created_at")

  commande        Commande           @relation(fields: [commandeId], references: [id])
  telephoneExecuteur TelephoneExecuteur? @relation(fields: [telephoneExecuteurId], references: [id])

  @@index([priorite, statutExecution])
  @@map("taches_ussd")
}

model TransactionLog {
  id          String   @id @default(uuid()) @db.Uuid
  typeEvenement String @map("type_evenement") @db.VarChar(50)
  severite    String   @default("info") @db.VarChar(20)
  details     Json?    @default("{}") @db.JsonB
  userId      String?  @map("user_id") @db.Uuid
  commandeId  String?  @map("commande_id") @db.Uuid
  adresseIp   String?  @map("adresse_ip") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  user    User?     @relation(fields: [userId], references: [id])
  commande Commande? @relation(fields: [commandeId], references: [id])

  @@index([createdAt])
  @@map("transactions_logs")
}

model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50)
  titre     String   @db.VarChar(255)
  message   String   @db.Text
  lu        Boolean  @default(false)
  donnees   Json?    @default("{}") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}
```

### Intégration Redis avec Prisma :

```javascript
// src/config/prisma.js — Client Prisma avec cache Redis intégré
const { PrismaClient } = require('@prisma/client');
const redis = require('./redis');

const prisma = new PrismaClient().$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const cacheKey = `prisma:${model}:${operation}:${JSON.stringify(args)}`;
      const ttl = 60; // 60 secondes de cache

      // Lecture : vérifier Redis d'abord
      if (['findUnique', 'findFirst', 'findMany'].includes(operation)) {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }

      // Exécution de la requête Prisma
      const result = await query(args);

      // Écriture : invalider le cache du modèle
      if (['create', 'update', 'delete', 'upsert'].includes(operation)) {
        const keys = await redis.keys(`prisma:${model}:*`);
        if (keys.length > 0) await redis.del(keys);
      }

      // Mettre en cache les résultats de lecture
      if (['findUnique', 'findFirst', 'findMany'].includes(operation)) {
        await redis.setex(cacheKey, ttl, JSON.stringify(result));
      }

      return result;
    }
  }
});

module.exports = prisma;
```

### Redis Bull pour files d'attente :

```javascript
// src/services/ussdQueue.service.js — File d'attente USSD avec Redis Bull
const Queue = require('bull');

const ussdQueue = new Queue('ussd-execution', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

// Rate limiter: max 2 tâches par téléphone simultanément
ussdQueue.setRateLimiter({
  max: 2,
  duration: 1000,
  groupKey: 'phoneId'
});

// Traitement des jobs
ussdQueue.process(async (job) => {
  const { phoneId, code, sequence } = job.data;
  // Envoi via WebSocket au téléphone
  return { status: 'executing' };
});

module.exports = { ussdQueue };
```

### Commandes package.json (dépendances à ajouter) :
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bull": "^4.12.0",
    "ioredis": "^5.3.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "socket.io": "^4.7.0",
    "multer": "^1.4.5",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  },
  "scripts": {
    "postinstall": "prisma generate",
    "migrate": "prisma migrate deploy",
    "seed": "prisma db seed",
    "studio": "prisma studio"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

---

## 2. BACKEND API NODE.JS/EXPRESS

Génère l'intégralité du backend avec :

### Structure complète du projet :
```
backend-api/
├── Dockerfile
├── Dockerfile.dev
├── package.json
├── .env.example
├── prisma/
│   └── schema.prisma             # Schéma Prisma complet (tables, relations, indexes, seeds)
├── src/
│   ├── app.js                    # Point d'entrée
│   ├── server.js                 # Démarrage HTTP/HTTPS
│   ├── config/
│   │   ├── prisma.js             # Client Prisma ORM + middleware cache Redis
│   │   ├── redis.js              # Client Redis (cache + Bull queues)
│   │   ├── jwt.js                # Configuration JWT
│   │   └── logger.js             # Winston logger
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── services.routes.js
│   │   ├── commandes.routes.js
│   │   ├── paiement.routes.js
│   │   ├── admin.routes.js
│   │   └── webhook.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── services.controller.js
│   │   ├── commandes.controller.js
│   │   ├── paiement.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rateLimiter.js         # Rate limiting via Redis (sliding window)
│   │   ├── validator.js
│   │   ├── upload.middleware.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── wave.service.js         # Génération liens Wave
│   │   ├── ussdQueue.service.js    # File d'attente Redis Bull
│   │   ├── prismaCache.service.js  # Cache Redis pour requêtes Prisma
│   │   ├── iaValidator.service.js  # Communication IA
│   │   ├── notification.service.js # Push/Email/SMS
│   │   └── pdf.service.js          # Génération reçus
│   ├── jobs/
│   │   ├── expirationJob.js        # Nettoyage commandes expirées (Bull)
│   │   └── retryJob.js            # Réessayer tâches échouées (Bull)
│   ├── websocket/
│   │   └── wsManager.js           # Gestion WebSocket
│   └── utils/
│       ├── helpers.js
│       ├── constants.js
│       └── validators.js
└── tests/
    ├── auth.test.js
    ├── commandes.test.js
    └── paiement.test.js
```

### Endpoints API complets à générer :

**AUTHENTIFICATION :**
```javascript
POST /api/auth/register
Body: { nom, prenom, telephone, email, mot_de_passe }
Response: { token, user }
Validation: téléphone format ivoirien, email valide, mot de passe 8+ caractères

POST /api/auth/login
Body: { telephone, mot_de_passe }
Response: { token, refreshToken, user }
Rate limit: 5 tentatives par minute

POST /api/auth/refresh-token
Body: { refreshToken }
Response: { token }

POST /api/auth/verify-phone
Body: { telephone, code }
```

**SERVICES :**
```javascript
GET /api/services
Query: ?operateur=orange&type=internet&min_price=1000&max_price=5000&search=2Go
Response: { services: [...], pagination: {...} }

GET /api/services/:id
Response: { service: {...}, instructions: "..." }

GET /api/services/featured
Response: { populaires: [...], promotions: [...] }
```

**COMMANDES :**
```javascript
POST /api/commandes
Auth: Bearer token
Body: { 
  service_id, 
  telephone_beneficiaire, 
  operateur  // validation auto par préfixe
}
Response: { 
  commande: {...}, 
  lien_paiement: "https://pay.wave.com/m/MONCODE/2000",
  reference: "USSD-20260118-ABCD",
  qr_code: "data:image/png;base64,...",
  expire_dans: "15 minutes"
}

GET /api/commandes/:id
Response: { commande, statut, timeline }

GET /api/commandes/mes-commandes
Auth: Bearer token
Query: ?statut=termine&page=1&limit=10
Response: { commandes: [...], pagination }

POST /api/commandes/:id/annuler
Auth: Bearer token
```

**PAIEMENT :**
```javascript
POST /api/paiement/upload-proof
Auth: Bearer token
Body: multipart/form-data {
  commande_id,
  image: file (max 10MB, jpg/png/heic)
}
Process:
  1. Sauvegarde image dans volume Docker
  2. Optimisation/compression
  3. Envoi au service IA
  4. Réponse immédiate avec statut préliminaire
Response: {
  statut_validation: "en_cours",
  temps_estime: "10-30 secondes"
}

GET /api/paiement/status/:commandeId
Response: {
  statut: "paiement_valide",
  score_confiance: 95.5,
  details_ia: {...}
}
```

**ADMIN :**
```javascript
GET /api/admin/dashboard
Auth: Admin token
Response: {
  stats_jour: { commandes, revenus, taux_succes },
  telephones_actifs: 3,
  file_attente: 12,
  taux_echec: 2.5
}

GET /api/admin/telephones
Response: {
  telephones: [
    { 
      nom: "Samsung A14", 
      operateur: "Orange", 
      statut: "en_ligne",
      batterie: 85,
      taches_en_cours: 2,
      temps_reponse_moyen: 3.2
    }
  ]
}

POST /api/admin/commandes/:id/revalider
Body: { action: "valider"|"rejeter", commentaire: "..." }

GET /api/admin/logs
Query: ?severite=error&date_debut=2026-01-01&date_fin=2026-01-18
```

### Middleware à implémenter avec code complet :

**1. Authentification JWT :**
```javascript
// Vérifie token dans Authorization header
// Extrait user_id et rôle
// Attache à req.user
// Gère refresh tokens automatique si expiré proche
```

**2. Rate Limiting :**
```javascript
// Par IP: 100 requêtes/15min global
// Par user: 20 requêtes/15min sur endpoints sensibles
// Stockage dans Redis avec sliding window
```

**3. Upload Sécurisé :**
```javascript
// Accepte uniquement images (jpeg, png, heic)
// Taille max: 10MB
// Scan antivirus basique (magic bytes)
// Renommage UUID pour sécurité
// Stockage dans /app/uploads/proofs/
```

**4. Validator de Requêtes :**
```javascript
// Utilise Joi pour valider tous les inputs
// Sanitize contre XSS
// Validation téléphone format ivoirien: /^(07|05|01)\d{8}$/
```

### Service Wave Business à générer :
```javascript
class WaveService {
  // Générer lien de paiement (sans API)
  generatePaymentLink(amount, reference) {
    // Format: https://pay.wave.com/m/{MERCHANT_CODE}/{amount}
    // Ajoute paramètres: ?ref={reference}&callback={url}
    return {
      url: `https://pay.wave.com/m/${process.env.WAVE_MERCHANT_CODE}/${amount}?ref=${reference}`,
      qrCode: this.generateQR(url),
      expiresIn: 15 * 60 * 1000 // 15 minutes
    };
  }
  
  // Vérifier réception manuelle (sera couplée avec IA)
  async checkPaymentReceived(phoneNumber, amount, reference) {
    // Cette méthode sera appelée après validation IA
    // Vérifie dans l'historique Wave Business manuellement
  }
}
```

---

## 3. SERVICE IA DE VALIDATION PYTHON/FASTAPI

Génère le code complet avec :

### Structure du projet :
```
ia-validator/
├── Dockerfile
├── requirements.txt
├── main.py
├── config.py
├── models/
│   ├── __init__.py
│   ├── ocr_extractor.py      # Extraction OCR avancée
│   ├── fraud_detector.py     # Détection de fraude
│   └── payment_classifier.py # Classification finale
├── services/
│   ├── __init__.py
│   ├── image_processor.py    # Prétraitement images
│   ├── wave_template.py      # Patterns Wave Business
│   └── confidence.py         # Calcul score confiance
├── ml_models/
│   ├── fraud_model.h5        # Modèle TensorFlow pré-entraîné
│   └── scaler.pkl            # StandardScaler
├── utils/
│   ├── image_utils.py
│   └── text_utils.py
└── tests/
    └── test_validator.py
```

### Pipeline de Validation à 4 Niveaux :

```python
# main.py - Endpoint principal
@app.post("/validate/payment")
async def validate_payment(
    image: UploadFile,
    commande_id: str,
    expected_amount: float,
    expected_phone: str,
    background_tasks: BackgroundTasks
):
    """
    Pipeline complet de validation
    """
    
    # Sauvegarde temporaire
    image_path = save_temp_image(image)
    
    # NIVEAU 1: Validation structurelle
    level1 = await validate_image_structure(image_path)
    if not level1['valid']:
        return {"status": "rejected", "reason": level1['reason']}
    
    # NIVEAU 2: Extraction OCR
    extracted_data = await extract_wave_data(image_path)
    
    # NIVEAU 3: Vérification cohérence
    coherence = check_coherence(extracted_data, expected_amount, expected_phone)
    
    # NIVEAU 4: Détection fraude
    fraud_analysis = await detect_fraud(image_path)
    
    # Score final
    final_score = calculate_final_score(level1, coherence, fraud_analysis)
    
    # Décision
    decision = make_decision(final_score)
    
    # Nettoyage
    cleanup_temp(image_path)
    
    return {
        "status": decision,
        "confidence_score": final_score,
        "extracted_data": extracted_data,
        "validation_details": {
            "level1_structure": level1,
            "level2_ocr": extracted_data,
            "level3_coherence": coherence,
            "level4_fraud": fraud_analysis
        },
        "flags": generate_flags(fraud_analysis),
        "timestamp": datetime.utcnow().isoformat()
    }

async def extract_wave_data(image_path: str) -> dict:
    """
    Extrait spécifiquement les informations Wave:
    - Montant (format CFA: 2.000 F, 5000F)
    - Numéro destinataire
    - Référence transaction
    - Date/heure
    - Statut (Réussi/Échoué)
    - Nom du marchand
    """
    # Utiliser EasyOCR ou Tesseract avec preprocessing
    # Cibler les zones spécifiques de l'interface Wave
    pass

async def detect_fraud(image_path: str) -> dict:
    """
    Détection de fraude multi-facteurs:
    1. Analyse ELA (Error Level Analysis) pour détecter Photoshop
    2. Vérification métadonnées EXIF
    3. Comparaison avec base de patterns frauduleux
    4. Détection de réutilisation d'image (hash perceptif)
    5. Analyse de cohérence temporelle
    """
    pass
```

### Modèle de Détection de Fraude :

```python
# fraud_detector.py
import tensorflow as tf
from tensorflow import keras

class FraudDetector:
    def __init__(self):
        self.model = self.build_model()
        self.load_pretrained_weights()
    
    def build_model(self):
        """
        CNN pour classifier images authentiques vs modifiées
        """
        model = keras.Sequential([
            # Couches de convolution
            keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(224,224,3)),
            keras.layers.MaxPooling2D(2,2),
            keras.layers.Conv2D(64, (3,3), activation='relu'),
            keras.layers.MaxPooling2D(2,2),
            keras.layers.Conv2D(128, (3,3), activation='relu'),
            keras.layers.MaxPooling2D(2,2),
            
            # Couches denses
            keras.layers.Flatten(),
            keras.layers.Dense(512, activation='relu'),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(256, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')  # 0: authentique, 1: frauduleux
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC()]
        )
        
        return model
    
    def ela_analysis(self, image_path: str) -> float:
        """
        Error Level Analysis
        Sauvegarde image à qualité 95% et compare différences
        Les zones modifiées auront un taux d'erreur plus élevé
        """
        pass
    
    def perceptual_hash(self, image_path: str) -> str:
        """
        Hash perceptif pour détecter réutilisation
        Comparer avec base de données des dernières 24h
        """
        pass
```

### Seuils de Décision :
```python
DECISION_THRESHOLDS = {
    'auto_validate': 0.90,    # ≥ 90% → validation automatique
    'manual_review': 0.70,    # 70-89% → révision manuelle
    'auto_reject': 0.50       # < 50% → rejet automatique
}
```

---

## 4. APPLICATION MOBILE FLUTTER

Génère l'application Flutter complète avec bridge natif Kotlin minimal :

### Structure du projet Flutter :
```
ussd_executor_app/
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── app.dart                          # MaterialApp configuré
│   ├── config/
│   │   ├── app_config.dart               # Configuration serveur
│   │   ├── theme.dart                    # Thème sombre/clair
│   │   └── routes.dart                   # Navigation
│   ├── core/
│   │   ├── di/
│   │   │   └── injection_container.dart  # GetIt DI
│   │   ├── network/
│   │   │   ├── websocket_client.dart     # Client WebSocket
│   │   │   ├── api_client.dart           # HTTP client
│   │   │   └── network_info.dart         # Connectivité
│   │   ├── services/
│   │   │   ├── ussd_executor.dart        # Service USSD principal
│   │   │   ├── phone_monitor.dart        # Battery, signal, etc.
│   │   │   ├── task_queue_manager.dart   # File d'attente locale
│   │   │   └── sync_service.dart         # Sync avec serveur
│   │   ├── models/
│   │   │   ├── ussd_task.dart
│   │   │   ├── phone_status.dart
│   │   │   ├── server_config.dart
│   │   │   └── execution_result.dart
│   │   └── utils/
│   │       ├── logger.dart
│   │       ├── permissions.dart
│   │       └── constants.dart
│   ├── features/
│   │   ├── splash/
│   │   │   └── splash_screen.dart
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   └── phone_auth_screen.dart
│   │   │   └── providers/
│   │   │       └── auth_provider.dart
│   │   ├── dashboard/
│   │   │   ├── screens/
│   │   │   │   └── executor_dashboard.dart
│   │   │   ├── widgets/
│   │   │   │   ├── status_header.dart
│   │   │   │   ├── task_list.dart
│   │   │   │   ├── performance_chart.dart
│   │   │   │   └── quick_actions.dart
│   │   │   └── providers/
│   │   │       └── dashboard_provider.dart
│   │   └── settings/
│   │       ├── screens/
│   │       │   └── settings_screen.dart
│   │       └── widgets/
│   │           ├── server_config_form.dart
│   │           └── accessibility_check.dart
│   └── native_bridge/
│       ├── ussd_bridge.dart              # MethodChannel USSD
│       └── phone_state_bridge.dart       # Phone state monitoring
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   │       └── main/
│   │           ├── AndroidManifest.xml
│   │           └── kotlin/
│   │               └── com/ussdautomator/
│   │                   ├── MainActivity.kt
│   │                   ├── USSDService.kt          # Service d'accessibilité
│   │                   └── USSDPlugin.kt           # Bridge Flutter
│   └── settings.gradle
└── ios/  (optionnel pour futur dashboard admin)
```

### Code Flutter Critique :

**1. Main avec Initialisation :**
```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisation services
  await setupDependencies();
  
  // Vérification permissions
  await PermissionHandler.checkAll();
  
  // Connexion WebSocket
  final wsService = getIt<WebSocketService>();
  wsService.connect();
  
  runApp(USSDExecutorApp());
}
```

**2. Service USSD avec Bridge Natif :**
```dart
// core/services/ussd_executor.dart
class USSDExecutor {
  static const MethodChannel _channel = MethodChannel('com.app/ussd');
  
  Future<ExecutionResult> executeUSSD({
    required String code,
    required List<String> sequence,
    int timeout = 30,
    Function(double)? onProgress,
  }) async {
    try {
      // Envoi au service d'accessibilité via bridge natif
      final result = await _channel.invokeMethod('executeUSSD', {
        'code': code,
        'sequence': sequence,
        'timeout': timeout,
      });
      
      // Parser résultat
      final execution = ExecutionResult.fromMap(result);
      
      // Notifier progression
      onProgress?.call(execution.progress);
      
      return execution;
    } on PlatformException catch (e) {
      return ExecutionResult.error(e.message ?? 'Erreur inconnue');
    }
  }
  
  Future<bool> checkAccessibility() async {
    return await _channel.invokeMethod('isAccessibilityEnabled');
  }
  
  Future<void> openAccessibilitySettings() async {
    await _channel.invokeMethod('openAccessibilitySettings');
  }
}
```

**3. Dashboard Exécuteur Flutter :**
```dart
// features/dashboard/screens/executor_dashboard.dart
class ExecutorDashboard extends StatefulWidget {
  @override
  _ExecutorDashboardState createState() => _ExecutorDashboardState();
}

class _ExecutorDashboardState extends State<ExecutorDashboard>
    with WidgetsBindingObserver {
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header avec statut
            _buildStatusHeader(),
            
            // Stats rapides
            _buildQuickStats(),
            
            // File d'attente en cours
            Expanded(
              child: _buildTaskQueue(),
            ),
            
            // Actions rapides
            _buildQuickActions(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatusHeader() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade800, Colors.blue.shade600],
        ),
      ),
      child: Column(
        children: [
          // Nom téléphone + opérateur
          Row(
            children: [
              Icon(Icons.phone_android, color: Colors.white, size: 40),
              SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Samsung A14',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text('Orange CI • En ligne',
                    style: TextStyle(color: Colors.white70),
                  ),
                ],
              ),
              Spacer(),
              // Indicateur connexion
              _ConnectionIndicator(),
            ],
          ),
          SizedBox(height: 16),
          // Barre de progression tâches
          LinearProgressIndicator(
            value: 0.3, // 3/10 tâches
            backgroundColor: Colors.white24,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.greenAccent),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTaskQueue() {
    return Consumer<DashboardProvider>(
      builder: (context, provider, child) {
        if (provider.activeTasks.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Lottie.asset('assets/idle.json', height: 200),
                Text('En attente de tâches...',
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
              ],
            ),
          );
        }
        
        return ListView.builder(
          itemCount: provider.activeTasks.length,
          itemBuilder: (context, index) {
            final task = provider.activeTasks[index];
            return TaskCard(task: task);
          },
        );
      },
    );
  }
}
```

**4. Gestionnaire WebSocket Flutter :**
```dart
// core/network/websocket_client.dart
class WebSocketService {
  late final Socket socket;
  final StreamController<ServerCommand> _commandController = 
      StreamController.broadcast();
  
  Stream<ServerCommand> get commands => _commandController.stream;
  
  void connect() {
    socket = io(
      AppConfig.wsUrl,
      OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .setAuth({'token': AppConfig.phoneToken})
        .build(),
    );
    
    // Écouter les commandes du serveur
    socket.on('ussd:execute', (data) {
      final command = ServerCommand.fromJson(data);
      _commandController.add(command);
    });
    
    // Envoyer statut périodiquement
    Timer.periodic(Duration(seconds: 30), (_) {
      socket.emit('phone:status', PhoneMonitor.getStatus().toJson());
    });
    
    // Reconnexion automatique
    socket.onDisconnect((_) {
      Future.delayed(Duration(seconds: 5), connect);
    });
  }
}
```

### Bridge Natif Kotlin (Minimal) :

```kotlin
// android/app/src/main/kotlin/com/ussdautomator/USSDPlugin.kt
class USSDPlugin : MethodChannel.MethodCallHandler, USSDService.USSDCallback {
    
    private var pendingResult: MethodChannel.Result? = null
    private var sequenceIndex = 0
    private var sequence = listOf<String>()
    
    companion object {
        @JvmStatic
        fun registerWith(registrar: Registrar) {
            val channel = MethodChannel(registrar.messenger(), "com.app/ussd")
            channel.setMethodCallHandler(USSDPlugin(registrar.activity()))
        }
    }
    
    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "executeUSSD" -> {
                val code = call.argument<String>("code") ?: ""
                val sequence = call.argument<List<String>>("sequence") ?: emptyList()
                executeUSSDSession(code, sequence, result)
            }
            "isAccessibilityEnabled" -> {
                result.success(USSDService.isRunning)
            }
            "openAccessibilitySettings" -> {
                context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                result.success(true)
            }
            else -> result.notImplemented()
        }
    }
    
    private fun executeUSSDSession(code: String, seq: List<String>, result: MethodChannel.Result) {
        pendingResult = result
        sequence = seq
        sequenceIndex = 0
        
        USSDService.callback = this
        USSDService.dialUSSD(code)
    }
    
    override fun onUSSDResponse(response: String) {
        if (sequenceIndex < sequence.size) {
            // Envoyer le prochain choix
            val nextInput = sequence[sequenceIndex]
            sequenceIndex++
            USSDService.sendInput(nextInput)
        } else {
            // Session terminée
            pendingResult?.success(mapOf(
                "success" to true,
                "message" to response,
                "progress" to 1.0
            ))
            pendingResult = null
        }
    }
    
    override fun onUSSDError(error: String) {
        pendingResult?.error("USSD_ERROR", error, null)
        pendingResult = null
    }
}

// USSDService.kt - Service d'accessibilité
class USSDService : AccessibilityService() {
    
    companion object {
        var isRunning = false
        var callback: USSDCallback? = null
    }
    
    interface USSDCallback {
        fun onUSSDResponse(response: String)
        fun onUSSDError(error: String)
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event?.let { e ->
            if (e.className == "android.app.AlertDialog") {
                // Capturer le texte du dialogue USSD
                val text = e.text.joinToString(" ")
                if (text.isNotEmpty()) {
                    callback?.onUSSDResponse(text)
                }
            }
        }
    }
    
    override fun onInterrupt() {
        isRunning = false
    }
    
    fun dialUSSD(code: String) {
        val intent = Intent(Intent.ACTION_CALL)
        intent.data = Uri.parse("tel:${Uri.encode(code)}")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }
    
    fun sendInput(input: String) {
        // Simuler l'envoi du choix
        performGlobalAction(GLOBAL_ACTION_BACK) // Optionnel
    }
}
```

---

## 5. FRONTEND WEB REACT.JS

Génère l'application React complète avec :

### Structure du projet :
```
frontend-web/
├── Dockerfile
├── nginx.conf
├── package.json
├── src/
│   ├── App.jsx
│   ├── index.jsx
│   ├── routes.jsx
│   ├── assets/
│   │   ├── images/
│   │   │   ├── orange-logo.svg
│   │   │   ├── mtn-logo.svg
│   │   │   └── moov-logo.svg
│   │   └── animations/
│   │       ├── payment-success.json
│   │       └── loading-ussd.json
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── catalogue/
│   │   │   ├── ServiceCard.jsx
│   │   │   ├── OperatorFilter.jsx
│   │   │   └── ServiceGrid.jsx
│   │   ├── paiement/
│   │   │   ├── PaymentLink.jsx
│   │   │   ├── QRCode.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   └── Timer.jsx
│   │   └── suivi/
│   │       ├── ProgressTracker.jsx
│   │       ├── StatusBadge.jsx
│   │       └── Timeline.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Catalogue.jsx
│   │   ├── Commande.jsx
│   │   ├── Paiement.jsx
│   │   ├── Suivi.jsx
│   │   ├── Connexion.jsx
│   │   ├── Inscription.jsx
│   │   └── Profil.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── websocket.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useWebSocket.js
│   │   └── useTimer.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   └── utils/
│       ├── formatters.js
│       └── validators.js
```

### Pages principales React à générer :

**1. Page Catalogue :**
```jsx
// Affichage responsive
// Cartes avec skeleton loading
// Filtres avancés avec animations
// Ajout au panier fluide
// Prix en F CFA
// Badge opérateur avec logo
```

**2. Page Paiement :**
```jsx
// Timeline: Service → Paiement → Validation → Activation
// QR Code du lien Wave
// Bouton copier avec animation
// Countdown timer (15 min)
// Zone upload drag & drop
// Preview image avant envoi
// Feedback instantané upload
```

**3. Page Suivi :**
```jsx
// WebSocket temps réel
// Barre progression animée
// Statut avec icônes animées
// Logs en temps réel
// Bouton support si erreur
// Reçu téléchargeable (PDF)
```

### Composant Suivi en Temps Réel :
```jsx
// Suivi.jsx
const Suivi = ({ commandeId }) => {
  const [commande, setCommande] = useState(null);
  const { lastMessage } = useWebSocket(`/commande/${commandeId}`);
  
  useEffect(() => {
    if (lastMessage) {
      setCommande(prev => ({
        ...prev,
        ...lastMessage
      }));
    }
  }, [lastMessage]);
  
  const etapes = [
    { key: 'en_attente_paiement', label: 'Paiement', icon: '💰' },
    { key: 'paiement_soumis', label: 'Vérification IA', icon: '🤖' },
    { key: 'paiement_valide', label: 'Envoi USSD', icon: '📡' },
    { key: 'en_cours_execution', label: 'Activation', icon: '⚡' },
    { key: 'execute', label: 'Terminé !', icon: '✅' },
  ];
  
  const currentStep = etapes.findIndex(e => e.key === commande?.statut);
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      <ProgressTracker 
        steps={etapes} 
        currentStep={currentStep} 
      />
      
      {commande?.statut === 'en_cours_execution' && (
        <div className="mt-8 text-center">
          <Lottie animation="loading-ussd" />
          <p>Exécution du code USSD en cours...</p>
          <p className="text-sm text-gray-500">
            Ne quittez pas, cela prend environ 30 secondes
          </p>
        </div>
      )}
      
      {commande?.statut === 'execute' && (
        <div className="mt-8 text-center">
          <Lottie animation="payment-success" />
          <h2 className="text-2xl font-bold text-green-600">
            Service activé avec succès !
          </h2>
          <Button onClick={downloadRecu}>
            Télécharger le reçu
          </Button>
        </div>
      )}
    </div>
  );
};
```

---

## 6. WEBSOCKET SERVER

Génère le serveur WebSocket complet :

```javascript
// websocket-server/src/server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Namespace pour les téléphones
const phoneNamespace = io.of('/phones');

phoneNamespace.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  // Vérifier token dans DB
  const phone = await Telephone.findOne({ where: { token_auth: token } });
  if (!phone) {
    return next(new Error('Authentification échouée'));
  }
  socket.phoneId = phone.id;
  socket.operator = phone.operateur;
  next();
});

phoneNamespace.on('connection', (socket) => {
  console.log(`Téléphone connecté: ${socket.phoneId}`);
  
  // Mise à jour statut
  updatePhoneStatus(socket.phoneId, 'en_ligne');
  
  // Réception statut périodique
  socket.on('phone:status', async (status) => {
    await updatePhoneStatus(socket.phoneId, 'en_ligne', status);
  });
  
  // Réception résultat exécution USSD
  socket.on('ussd:result', async (data) => {
    const { taskId, success, message } = data;
    
    // Mettre à jour tâche
    await updateTask(taskId, success, message);
    
    // Notifier client web
    const task = await getTask(taskId);
    webNamespace.to(`commande:${task.commande_id}`).emit('status:update', {
      commandeId: task.commande_id,
      status: success ? 'execute' : 'echoue',
      message
    });
  });
  
  socket.on('disconnect', () => {
    updatePhoneStatus(socket.phoneId, 'hors_ligne');
  });
});

// Namespace pour les clients web
const webNamespace = io.of('/web');

webNamespace.on('connection', (socket) => {
  // Rejoindre une room pour suivre une commande
  socket.on('subscribe:commande', (commandeId) => {
    socket.join(`commande:${commandeId}`);
  });
  
  socket.on('unsubscribe:commande', (commandeId) => {
    socket.leave(`commande:${commandeId}`);
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
});
```

---

## 7. SCRIPTS DE DÉPLOIEMENT

### docker-compose.yml complet :
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ussd_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-ussd_automation}
      POSTGRES_USER: ${POSTGRES_USER:-ussd_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: ussd_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend-api:
    build:
      context: ./backend-api
      dockerfile: Dockerfile
    container_name: ussd_backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      IA_VALIDATOR_URL: http://ia-validator:8000
      WS_SERVER_URL: http://websocket-server:8080
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend_network
      - frontend_network
    restart: unless-stopped

  ia-validator:
    build:
      context: ./ia-validator
      dockerfile: Dockerfile
    container_name: ussd_ia
    environment:
      MODEL_PATH: /app/ml_models
      CONFIDENCE_THRESHOLD: ${IA_CONFIDENCE_THRESHOLD:-0.85}
    volumes:
      - uploads:/app/uploads:ro
      - ./ia-validator/ml_models:/app/ml_models
    networks:
      - backend_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'

  websocket-server:
    build:
      context: ./websocket-server
      dockerfile: Dockerfile
    container_name: ussd_websocket
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend_network
      - phone_network
    restart: unless-stopped

  frontend-web:
    build:
      context: ./frontend-web
      dockerfile: Dockerfile
    container_name: ussd_frontend
    environment:
      REACT_APP_API_URL: /api
      REACT_APP_WS_URL: /ws
    depends_on:
      - backend-api
    networks:
      - frontend_network
    restart: unless-stopped

  admin-dashboard:
    build:
      context: ./admin-dashboard
      dockerfile: Dockerfile
    container_name: ussd_admin
    environment:
      REACT_APP_API_URL: /api
    depends_on:
      - backend-api
    networks:
      - frontend_network
    restart: unless-stopped

  nginx-proxy:
    image: nginx:alpine
    container_name: ussd_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./certbot/www:/var/www/certbot
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend-web
      - admin-dashboard
      - backend-api
    networks:
      - frontend_network
    restart: unless-stopped

networks:
  frontend_network:
    driver: bridge
  backend_network:
    driver: bridge
  phone_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:
```

### Script d'initialisation :
```bash
#!/bin/bash
# setup.sh

echo "🚀 Déploiement USSD Automation Platform"
echo "========================================"

# Copier .env si non existant
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Fichier .env créé, veuillez le configurer"
  exit 1
fi

# Build images
echo "📦 Build des images Docker..."
docker-compose build

# Lancer services
echo "▶️  Démarrage des services..."
docker-compose up -d

# Attendre PostgreSQL
echo "⏳ Attente PostgreSQL..."
sleep 10

# Migrations
echo "🗄️  Exécution des migrations..."
docker-compose exec backend-api npm run migrate

# Seeds
echo "🌱 Insertion données initiales..."
docker-compose exec backend-api npm run seed

echo "✅ Déploiement terminé !"
echo "📱 Frontend: http://localhost"
echo "🔧 Admin: http://localhost:3001"
echo "📡 API: http://localhost:3000/api"
```

---

## 8. SÉCURITÉ GLOBALE

```javascript
// Checklist sécurité à implémenter :

// 1. Environnement
- [ ] Tous les secrets dans .env (jamais commité)
- [ ] HTTPS avec Let's Encrypt automatique
- [ ] Headers sécurité (Helmet.js)
- [ ] CORS configuré strictement

// 2. Authentification
- [ ] JWT avec rotation des refresh tokens
- [ ] bcrypt pour mots de passe (cost 12)
- [ ] Rate limiting sur login (5 tentatives/min)
- [ ] Sessions invalidables côté serveur

// 3. Uploads
- [ ] Scan antivirus des fichiers
- [ ] Validation magic bytes
- [ ] Taille max 10MB
- [ ] Stockage hors web root

// 4. API
- [ ] Rate limiting global et par endpoint
- [ ] Validation stricte des inputs (Joi)
- [ ] Protection XSS
- [ ] SQL injection prévenue par ORM

// 5. Infrastructure
- [ ] Réseaux Docker isolés
- [ ] Secrets Docker pour mots de passe
- [ ] Healthchecks sur tous les services
- [ ] Logs centralisés avec rotation
```

---

## INSTRUCTIONS FINALES

Génère chaque composant avec :
1. Code complet et testé
2. Commentaires explicatifs en français
3. Gestion exhaustive des erreurs
4. Tests unitaires pour les fonctions critiques
5. Documentation inline pour les fonctions complexes

Commence par générer le docker-compose.yml et les Dockerfiles, puis le schéma de base de données.
```

Voilà ! Ce prompt est maintenant complètement adapté avec Flutter, prêt à l'emploi. Tu peux le copier-coller directement dans Claude, GPT-4, Gemini ou tout autre LLM.

**Conseil d'utilisation :** Pour de meilleurs résultats, génère section par section en commençant par l'infrastructure Docker. Chaque réponse sera plus détaillée et cohérente.

Veux-tu que je commence par générer la première section (Docker + Base de données) avec ce prompt ?