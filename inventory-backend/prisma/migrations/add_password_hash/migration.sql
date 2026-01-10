-- Add password_hash to users table
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR;
