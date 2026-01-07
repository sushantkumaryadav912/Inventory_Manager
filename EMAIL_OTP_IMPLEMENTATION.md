# Email OTP Implementation Summary

## Overview
Complete email OTP (One-Time Password) authentication system has been implemented for user registration and password reset with secure email validation.

## Components Implemented

### 1. Database Schema Updates
**File:** `prisma/schema.prisma`

#### Changes to `users` table:
- Added `email_verified: Boolean` - tracks email verification status
- Added `email_verified_at: DateTime` - timestamp of verification

#### New `otp_tokens` table:
- `id: UUID` - primary key
- `user_id: UUID` - links to user
- `email: String` - email for which OTP was generated
- `otp_code: String` - 6-digit OTP code
- `type: String` - OTP type ('email_verification' or 'password_reset')
- `is_used: Boolean` - prevents OTP reuse
- `expires_at: DateTime` - OTP expiration time
- `created_at: DateTime` - creation timestamp
- Indexes on user_id, email, otp_code, expires_at for performance

### 2. Backend Services

#### EmailService (`src/auth/email.service.ts`)
Handles all email sending functionality:
- **SMTP Support:** Gmail, SendGrid, and any SMTP provider
- **Test Mode:** Console logging for development
- **Email Templates:**
  - OTP verification email (10-minute expiry)
  - Password reset email (30-minute expiry)
  - HTML formatted with professional styling
  - Fallback plain text versions

**Key Features:**
- Error handling and logging
- Configuration-based provider selection
- HTML email templates with security warnings

#### OtpService (`src/auth/otp.service.ts`)
Core OTP logic:
- **OTP Generation:** 6-digit random codes
- **Storage & Validation:** Database-backed verification
- **Expiration Management:** Automatic cleanup of expired OTPs
- **Rate Limiting:**
  - Email verification: 3 requests per 2 minutes
  - Password reset: 3 requests per 2 minutes
  - 15-30 minute cooldown after limit
- **Methods:**
  - `requestEmailVerificationOtp()` - Generate & send OTP for signup
  - `verifyEmailOtp()` - Validate OTP during signup
  - `requestPasswordResetOtp()` - Generate & send OTP for password reset
  - `verifyPasswordResetOtp()` - Validate OTP for password reset
  - `cleanupExpiredOtps()` - Maintenance task
  - `getOtpStatus()` - Debugging helper

### 3. Backend Endpoints

#### POST `/auth/request-otp`
Request OTP for email verification or password reset

**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "type": "email_verification" // or "password_reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to user@example.com..."
}
```

#### POST `/auth/verify-otp`
Verify OTP code

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "email_verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST `/auth/reset-password`
Complete password reset flow

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Modified POST `/auth/signup`
Now supports optional OTP verification

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "User Name",
  "otp_code": "123456" // Optional if email pre-verified
}
```

**Response includes:**
- `emailVerified: boolean` - Whether email was verified with OTP

### 4. Frontend Components

#### OtpRequestScreen (`src/components/auth/OtpVerification.jsx`)
Screen for requesting OTP
- Email input field
- Email validation
- Loading state
- Error handling
- Responsive design

#### OtpVerificationScreen (`src/components/auth/OtpVerification.jsx`)
Screen for entering and verifying OTP
- 6-digit OTP input with auto-focus
- Auto-submit on complete entry
- Countdown timer for resend button
- Resend OTP functionality
- Input validation
- User-friendly error messages
- Expiration notices

**Features:**
- Only accepts numeric input
- Auto-focuses on mount
- Auto-submits when 6 digits entered
- Countdown timer (60 seconds default)
- Resend OTP with rate limiting
- Clear expiration messaging

### 5. Frontend API Methods

**Updated `authService.js`:**
```javascript
async requestOtp(email, type, name)
async verifyOtp(email, otpCode, type)
async resetPassword(email, otpCode, newPassword)
```

## Security Features

✅ **Password Security:**
- BCrypt hashing (10 salt rounds)
- Minimum 8 characters
- Never stored in plain text

✅ **OTP Security:**
- 6-digit random codes
- Rate limiting (prevent brute force)
- Expiration (10-30 minutes)
- Single-use only
- Database tracking of all attempts

✅ **Email Security:**
- No email validation in error messages
- Secure password reset flow
- Security warnings in password reset email

✅ **Network Security:**
- HTTPS required in production
- JWT token-based auth
- Authorization guards on protected endpoints

## Configuration

### Environment Variables Required

```env
# Email Provider
EMAIL_PROVIDER=smtp|sendgrid|test

# SMTP (if EMAIL_PROVIDER=smtp)
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASSWORD=

# SendGrid (if EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=

# General
EMAIL_FROM=
JWT_SECRET=
```

### For Gmail SMTP:
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password in SMTP_PASSWORD (not regular password)

### For SendGrid:
1. Create account at sendgrid.com
2. Generate API key
3. Set SENDGRID_API_KEY in .env

### For Testing:
Set `EMAIL_PROVIDER=test` to log OTPs to console instead of sending

## Database Migration

### Run Migrations:
```bash
# With Prisma
npx prisma migrate dev --name add_email_otp_support

# Regenerate Prisma Client
npm run prisma:generate
```

### Manual SQL (if needed):
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  otp_code VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_user_id ON otp_tokens(user_id);
CREATE INDEX idx_otp_email ON otp_tokens(email);
CREATE INDEX idx_otp_code ON otp_tokens(otp_code);
CREATE INDEX idx_otp_expires_at ON otp_tokens(expires_at);
```

## Dependencies Added

### Backend
```json
{
  "bcrypt": "^5.1.1",
  "@types/bcrypt": "^5.0.2",
  "uuid": "^10.0.0",
  "nodemailer": "^6.9.7",
  "@types/nodemailer": "^6.4.14"
}
```

Install with:
```bash
cd inventory-backend
npm install
```

### Frontend
No new dependencies required (already has necessary packages)

## Files Created/Modified

### Created Files:
- `inventory-backend/src/auth/email.service.ts` - Email sending service
- `inventory-backend/src/auth/otp.service.ts` - OTP logic
- `inventory-backend/src/auth/jwt.strategy.ts` - JWT validation
- `inventory-backend/src/auth/jwt.guard.ts` - JWT guard
- `Orbis/src/components/auth/OtpVerification.jsx` - OTP UI components
- `EMAIL_OTP_SETUP.md` - Complete setup guide
- `CUSTOM_AUTH_MIGRATION.md` - Auth migration guide
- `inventory-backend/.env.example` - Example environment variables

### Modified Files:
- `inventory-backend/prisma/schema.prisma` - Added OTP schema
- `inventory-backend/src/auth/auth.service.ts` - Password hashing
- `inventory-backend/src/auth/auth.controller.ts` - OTP endpoints
- `inventory-backend/src/auth/auth.module.ts` - Module configuration
- `inventory-backend/package.json` - Added dependencies
- `Orbis/src/services/api/authService.js` - OTP methods
- `Orbis/src/context/AuthContext.jsx` - Updated for custom auth

## Testing the Implementation

### 1. Test Mode (Development)
Set `EMAIL_PROVIDER=test` in .env:
```
[TEST MODE] OTP Email to user@example.com: 123456
```

### 2. Manual Test with cURL

**Request OTP:**
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "type": "email_verification"
  }'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp_code": "123456",
    "type": "email_verification"
  }'
```

**Sign Up with OTP:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "name": "Test User",
    "otp_code": "123456"
  }'
```

## Workflow

### User Registration with Email Verification:
1. User enters email → Click "Send Code"
2. `POST /auth/request-otp` sends OTP to email
3. User receives 6-digit code via email
4. User enters code → Auto-verifies
5. `POST /auth/verify-otp` validates code
6. Proceed to password/profile setup
7. `POST /auth/signup` with `otp_code` parameter

### Password Reset Flow:
1. User clicks "Forgot Password"
2. `POST /auth/request-otp` with type='password_reset'
3. User receives OTP code via email
4. User enters code → `POST /auth/verify-otp`
5. User sets new password → `POST /auth/reset-password`
6. User can login with new password

## Next Steps

1. **Install Dependencies:**
   ```bash
   cd inventory-backend && npm install
   cd ../Orbis && npm install
   ```

2. **Configure Email:**
   - Add EMAIL_PROVIDER to .env
   - Add email credentials (SMTP or SendGrid)

3. **Run Database Migration:**
   ```bash
   npx prisma migrate dev --name add_email_otp_support
   ```

4. **Test Email Service:**
   - Set EMAIL_PROVIDER=test initially
   - Check console for OTP codes
   - Once working, switch to real email service

5. **Deploy to Staging:**
   - Test full signup and password reset flow
   - Verify email delivery
   - Test rate limiting

6. **Monitor Production:**
   - Watch for email delivery failures
   - Monitor rate limiting effectiveness
   - Clean up expired OTPs regularly

## Documentation References

- **Setup Guide:** `EMAIL_OTP_SETUP.md` - Complete configuration
- **Auth Migration:** `CUSTOM_AUTH_MIGRATION.md` - Custom auth setup
- **Code Examples:** See inline comments in source files

## Support & Troubleshooting

See `EMAIL_OTP_SETUP.md` for:
- Configuration troubleshooting
- Email delivery issues
- Rate limiting problems
- Database queries for debugging
- Production checklist
