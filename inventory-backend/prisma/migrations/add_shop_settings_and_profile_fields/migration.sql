-- Add missing fields for settings screens (idempotent)

-- Business profile + shop settings fields
ALTER TABLE "public"."shops"
ADD COLUMN IF NOT EXISTS "owner_name" VARCHAR,
ADD COLUMN IF NOT EXISTS "email" VARCHAR,
ADD COLUMN IF NOT EXISTS "city" VARCHAR,
ADD COLUMN IF NOT EXISTS "state" VARCHAR,
ADD COLUMN IF NOT EXISTS "pincode" VARCHAR,
ADD COLUMN IF NOT EXISTS "gst_number" VARCHAR,
ADD COLUMN IF NOT EXISTS "currency" VARCHAR DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS "tax_rate" NUMERIC,
ADD COLUMN IF NOT EXISTS "low_stock_threshold" INTEGER DEFAULT 10;

-- Account settings field
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "phone" VARCHAR;
