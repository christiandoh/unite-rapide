-- Migration pour bases existantes créées avant le passage au code PIN
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'mot_de_passe_hash'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "mot_de_passe_hash" TO "code_pin_hash";
  END IF;
END $$;
