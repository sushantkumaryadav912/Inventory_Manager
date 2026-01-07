# Custom Auth Migration Guide

## Overview
This document guides you through migrating from Neon Auth to custom email/password authentication with encrypted password storage.

## What Changed

### Frontend (Orbis Mobile App)
- **Removed**: Neon Auth client and dependencies
- **Added**: `customAuthClient.js` - Direct email/password authentication
- **Modified**: `AuthContext.jsx` - Now uses custom auth functions
- **Modified**: `authService.js` - Updated to send email/password credentials

### Backend (Inventory Manager API)
- **Database**: Added `password_hash` field to `users` table (encrypted bcrypt hash)
- **Auth Service**: New `AuthService` with bcrypt password hashing
- **Strategy**: Replaced Neon JWT Strategy with custom JWT strategy
- **Guard**: Replaced `NeonAuthGuard` with `JwtAuthGuard`
- **Controller**: Updated `/auth/signup`, `/auth/login` endpoints

## Implementation Steps

### 1. Backend Setup

#### Step 1a: Update Dependencies
```bash
cd inventory-backend
npm install bcrypt uuid
```

Verify `@types/bcrypt` is installed (should be in package.json already).

#### Step 1b: Database Migration
Run the migration to add `password_hash` column:

```bash
# Using SQL migration (if your DB allows direct SQL)
psql your_database_url < prisma/migrations/add_password_hash.sql

# OR using Prisma (recommended)
npx prisma migrate dev --name add_password_hash_to_users
```

After running the migration, regenerate Prisma client:
```bash
npm run prisma:generate
# or
npx prisma generate
```

#### Step 1c: Environment Variables
Add to your `.env` file:
```env
JWT_SECRET=your-super-secret-key-change-this-in-production
```

**IMPORTANT**: Set a strong, unique secret key in production.

#### Step 1d: Build Backend
```bash
npm run build
npm start:dev  # or your start command
```

### 2. Frontend Setup

#### Step 2a: Update Dependencies (Already in package.json)
The frontend already has the necessary crypto packages:
- `expo-crypto` - For password hashing (optional, passwords are hashed on backend)
- `@react-native-async-storage/async-storage` - For token storage

#### Step 2b: Rebuild App
```bash
cd Orbis
npm install  # Update dependencies
npm start    # Restart expo
```

## Testing the Migration

### Test Sign Up
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MySecurePassword123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User"
  },
  "expiresIn": 3600,
  "requiresOnboarding": true
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MySecurePassword123"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Changes

### Old Endpoints (Neon Auth)
- Required Neon Auth tokens from Neon JS client
- No password field in signup/login

### New Endpoints (Custom Auth)
All endpoints now use standard email/password credentials.

#### POST /auth/signup
```json
{
  "email": "user@example.com",
  "password": "secure_password_min_8_chars",
  "name": "User Name" // optional
}
```

Response:
```json
{
  "token": "jwt_token",
  "user": { "id", "email", "name" },
  "expiresIn": 3600,
  "requiresOnboarding": true
}
```

#### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### GET /auth/me
Requires: `Authorization: Bearer {token}`

Response:
```json
{
  "user": { "id", "email", "name", "shopId", "shopName", "role" }
}
```

#### POST /auth/logout
Requires: `Authorization: Bearer {token}`

#### POST /auth/onboard
Requires: `Authorization: Bearer {token}`
```json
{
  "shopName": "My Shop",
  "businessType": "retail" // optional
}
```

## Password Requirements

- **Minimum Length**: 8 characters
- **Hashing**: BCrypt with 10 salt rounds
- **Storage**: Only `password_hash` stored in database (actual password never stored)
- **Verification**: bcrypt.compare() used during login

## Security Notes

✅ **Implemented Security**:
- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- Secure password verification
- Password strength validation (min 8 chars)
- Token expiration (1 hour)

⚠️ **Still To Consider**:
- Rate limiting on auth endpoints (prevent brute force)
- HTTPS in production (required for security)
- Strong JWT secret in production
- Regular security updates for dependencies
- Consider adding password reset functionality
- Consider email verification for new accounts
- Monitor for suspicious login attempts
- Consider implementing refresh tokens for better UX

## Troubleshooting

### "JWT_SECRET environment variable is not set"
Solution: Add `JWT_SECRET` to your `.env` file

### "User with this email already exists"
Solution: Use a different email or implement a password reset flow

### "Invalid credentials"
Solution: Verify email and password are correct (case-sensitive)

### "Password must be at least 8 characters long"
Solution: Use a password with 8+ characters

### Database migration fails
Solution: Ensure you have database permissions, and check if column already exists

## Rollback (if needed)

To revert back to Neon Auth:
1. Keep the `password_hash` column (safe to leave)
2. Revert AuthModule and AuthService imports
3. Reinstall Neon packages
4. Restore old auth.guard.ts and neon.strategy.ts files
5. Update AuthContext.jsx imports back to neonAuthClient

## Next Steps

1. Test all auth flows (signup, login, logout, refresh)
2. Update any mobile app tests
3. Test with actual database
4. Verify token expiration and refresh behavior
5. Test error handling and edge cases
6. Deploy to staging for integration testing
7. Update documentation for users
8. Consider adding password reset functionality
9. Monitor logs for auth errors in production

## Support

For issues or questions:
1. Check the error messages in logs
2. Review password requirements
3. Verify environment variables are set
4. Ensure database migration was successful
5. Check JWT_SECRET is properly configured
