-- Add verification columns to users table
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "verification_token" VARCHAR,
ADD COLUMN IF NOT EXISTS "verification_token_expires_at" TIMESTAMP(6);

-- Create otp_tokens table
CREATE TABLE IF NOT EXISTS "public"."otp_tokens" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "email" VARCHAR NOT NULL,
  "otp_code" VARCHAR NOT NULL,
  "type" VARCHAR NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(6) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "otp_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create email_verification_logs table
CREATE TABLE IF NOT EXISTS "public"."email_verification_logs" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "email" VARCHAR NOT NULL,
  "verification_token" VARCHAR NOT NULL,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verified_at" TIMESTAMP(6),
  "token_expires_at" TIMESTAMP(6) NOT NULL,
  "abstract_api_result" VARCHAR,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_verification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for otp_tokens
CREATE INDEX IF NOT EXISTS "idx_otp_user_id" ON "public"."otp_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_otp_email" ON "public"."otp_tokens"("email");
CREATE INDEX IF NOT EXISTS "idx_otp_code" ON "public"."otp_tokens"("otp_code");
CREATE INDEX IF NOT EXISTS "idx_otp_expires_at" ON "public"."otp_tokens"("expires_at");

-- Create indexes for email_verification_logs
CREATE INDEX IF NOT EXISTS "idx_email_verification_user_id" ON "public"."email_verification_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_verification_email" ON "public"."email_verification_logs"("email");
CREATE INDEX IF NOT EXISTS "idx_email_verification_token" ON "public"."email_verification_logs"("verification_token");
CREATE INDEX IF NOT EXISTS "idx_email_verification_expires_at" ON "public"."email_verification_logs"("token_expires_at");
