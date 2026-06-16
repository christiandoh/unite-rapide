#!/bin/bash
set -e

echo "========================================"
echo "🚀 USSD Automation Platform - Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker est requis mais non installé${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose est requis mais non installé${NC}"
    exit 1
fi

# .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${BLUE}📝 Fichier .env créé depuis .env.example${NC}"
        echo -e "${RED}⚠️  Veuillez configurer les variables dans .env avant de continuer${NC}"
        echo ""
        echo "Variables à configurer obligatoirement:"
        echo "  - POSTGRES_PASSWORD"
        echo "  - REDIS_PASSWORD"
        echo "  - JWT_SECRET (min 32 caractères)"
        echo "  - JWT_REFRESH_SECRET (min 32 caractères)"
        echo "  - JEKO_API_KEY, JEKO_API_KEY_ID, JEKO_STORE_ID"
        echo "  - ADMIN_PIN (code à 4 chiffres)"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ Fichier .env.example non trouvé${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📦 Build des images Docker...${NC}"
docker compose build

echo -e "${BLUE}▶️  Démarrage des services...${NC}"
docker compose up -d

echo -e "${BLUE}⏳ Attente du démarrage des services...${NC}"
sleep 15

echo -e "${BLUE}🔐 Génération des certificats SSL dev...${NC}"
bash scripts/generate-ssl.sh nginx/ssl 2>/dev/null || true

echo -e "${BLUE}🗄️  Exécution des migrations Prisma...${NC}"
docker compose exec backend-api npx prisma migrate deploy

echo -e "${BLUE}🌱 Insertion des données initiales...${NC}"
docker compose exec backend-api npm run seed

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  📱 Frontend:    ${BLUE}http://localhost${NC}"
echo -e "  🔧 Admin:       ${BLUE}http://localhost/admin${NC}"
echo -e "  📡 API:         ${BLUE}http://localhost:3000/api${NC}"
echo -e "  🗄️  Prisma Studio: ${BLUE}http://localhost:5555${NC}"
echo ""
echo -e "  Admin: configurez ADMIN_PHONE et ADMIN_PIN dans .env avant le seed"
echo ""
