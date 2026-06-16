-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "StatutUser" AS ENUM ('actif', 'suspendu', 'banni');

-- CreateEnum
CREATE TYPE "TypeService" AS ENUM ('forfait_internet', 'credit_appel', 'forfait_mixte', 'abonnement');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('en_attente_paiement', 'paiement_soumis', 'paiement_valide', 'paiement_rejete', 'en_cours_execution', 'execute', 'echoue', 'rembourse');

-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('en_attente', 'valide_auto', 'valide_manuel', 'rejete', 'a_reviser');

-- CreateEnum
CREATE TYPE "StatutPhone" AS ENUM ('en_ligne', 'hors_ligne', 'occupe', 'maintenance', 'erreur');

-- CreateEnum
CREATE TYPE "StatutExecution" AS ENUM ('en_attente', 'en_cours', 'reussi', 'echoue', 'timeout', 'annule');

-- CreateEnum
CREATE TYPE "SeveriteLog" AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100),
    "telephone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "code_pin_hash" VARCHAR(255) NOT NULL,
    "photo_url" VARCHAR(500),
    "email_verifie" BOOLEAN NOT NULL DEFAULT false,
    "telephone_verifie" BOOLEAN NOT NULL DEFAULT false,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'actif',
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operateurs" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "code_pays" VARCHAR(5) NOT NULL DEFAULT '+225',
    "prefixe" VARCHAR(10),
    "logo_url" VARCHAR(255),
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "operateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_catalogue" (
    "id" UUID NOT NULL,
    "operateur_id" UUID NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type_service" VARCHAR(50) NOT NULL,
    "code_ussd" VARCHAR(100) NOT NULL,
    "sequence_ussd" JSONB NOT NULL,
    "montant_wave" DECIMAL(10,2) NOT NULL,
    "volume_data" VARCHAR(50),
    "duree_validite" VARCHAR(50),
    "temps_execution_moyen" INTEGER NOT NULL DEFAULT 30,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "populaire" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_catalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "telephone_beneficiaire" VARCHAR(20) NOT NULL,
    "reference_unique" VARCHAR(20) NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "lien_paiement_wave" TEXT NOT NULL,
    "statut_commande" VARCHAR(30) NOT NULL DEFAULT 'en_attente_paiement',
    "date_expiration_paiement" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preuves_paiement" (
    "id" UUID NOT NULL,
    "commande_id" UUID NOT NULL,
    "image_originale_url" TEXT NOT NULL,
    "image_traitee_url" TEXT,
    "donnees_extraites" JSONB,
    "score_confiance" DECIMAL(5,2),
    "flags_fraude" JSONB DEFAULT '[]',
    "statut_validation" VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    "valide_par" UUID,
    "commentaire_validation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preuves_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telephones_executeurs" (
    "id" UUID NOT NULL,
    "nom_appareil" VARCHAR(100) NOT NULL,
    "modele" VARCHAR(100),
    "numero_telephone" VARCHAR(20) NOT NULL,
    "operateur_id" UUID NOT NULL,
    "token_auth" VARCHAR(255) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'hors_ligne',
    "niveau_batterie" INTEGER,
    "force_signal" INTEGER,
    "version_app" VARCHAR(20),
    "derniere_connexion" TIMESTAMP(3),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telephones_executeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches_ussd" (
    "id" UUID NOT NULL,
    "commande_id" UUID NOT NULL,
    "telephone_executeur_id" UUID,
    "priorite" INTEGER NOT NULL DEFAULT 5,
    "statut_execution" VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    "logs_execution" JSONB DEFAULT '[]',
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "tentative_max" INTEGER NOT NULL DEFAULT 3,
    "date_debut_execution" TIMESTAMP(3),
    "date_fin_execution" TIMESTAMP(3),
    "message_erreur" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taches_ussd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions_logs" (
    "id" UUID NOT NULL,
    "type_evenement" VARCHAR(50) NOT NULL,
    "severite" VARCHAR(20) NOT NULL DEFAULT 'info',
    "details" JSONB DEFAULT '{}',
    "user_id" UUID,
    "commande_id" UUID,
    "adresse_ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "donnees" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "operateurs_nom_key" ON "operateurs"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_reference_unique_key" ON "commandes"("reference_unique");

-- CreateIndex
CREATE INDEX "commandes_user_id_idx" ON "commandes"("user_id");

-- CreateIndex
CREATE INDEX "commandes_statut_commande_idx" ON "commandes"("statut_commande");

-- CreateIndex
CREATE INDEX "commandes_reference_unique_idx" ON "commandes"("reference_unique");

-- CreateIndex
CREATE UNIQUE INDEX "telephones_executeurs_numero_telephone_key" ON "telephones_executeurs"("numero_telephone");

-- CreateIndex
CREATE UNIQUE INDEX "telephones_executeurs_token_auth_key" ON "telephones_executeurs"("token_auth");

-- CreateIndex
CREATE INDEX "taches_ussd_priorite_statut_execution_idx" ON "taches_ussd"("priorite", "statut_execution");

-- CreateIndex
CREATE INDEX "transactions_logs_created_at_idx" ON "transactions_logs"("created_at");

-- AddForeignKey
ALTER TABLE "services_catalogue" ADD CONSTRAINT "services_catalogue_operateur_id_fkey" FOREIGN KEY ("operateur_id") REFERENCES "operateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services_catalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preuves_paiement" ADD CONSTRAINT "preuves_paiement_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preuves_paiement" ADD CONSTRAINT "preuves_paiement_valide_par_fkey" FOREIGN KEY ("valide_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telephones_executeurs" ADD CONSTRAINT "telephones_executeurs_operateur_id_fkey" FOREIGN KEY ("operateur_id") REFERENCES "operateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches_ussd" ADD CONSTRAINT "taches_ussd_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches_ussd" ADD CONSTRAINT "taches_ussd_telephone_executeur_id_fkey" FOREIGN KEY ("telephone_executeur_id") REFERENCES "telephones_executeurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_logs" ADD CONSTRAINT "transactions_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_logs" ADD CONSTRAINT "transactions_logs_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

