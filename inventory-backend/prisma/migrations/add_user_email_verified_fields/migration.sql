-- Add email verification + timestamps to users table (idempotent)
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(6) DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(6) DEFAULT now();

-- Indexes aligned with prisma/schema.prisma
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_verification_token" ON "public"."users"("verification_token");
