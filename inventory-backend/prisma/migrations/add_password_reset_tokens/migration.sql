-- Add password reset token columns to users table
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "password_reset_token_hash" VARCHAR,
ADD COLUMN IF NOT EXISTS "password_reset_token_expires_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "password_reset_token_used_at" TIMESTAMP(6);

-- Index expiry for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_users_password_reset_expires_at" ON "public"."users"("password_reset_token_expires_at");
