-- Migration: Add password_hash to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- Index for better query performance (optional)
-- CREATE INDEX idx_users_password_required ON users(id) WHERE password_hash IS NULL;

-- Note: After running this migration, update your prisma schema to regenerate client
-- Run: npm run prisma:generate or npx prisma generate
