ALTER TABLE "commandes" ADD COLUMN IF NOT EXISTS "jeko_payment_request_id" VARCHAR(100);
ALTER TABLE "commandes" ADD COLUMN IF NOT EXISTS "methode_paiement" VARCHAR(20);
