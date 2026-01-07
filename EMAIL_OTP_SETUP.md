# Email OTP Configuration Guide

## Overview
This document provides complete setup and configuration instructions for the email OTP (One-Time Password) system for user registration and password reset.

## System Features

### ✅ Built-In Features
- **6-digit OTP generation** with cryptographic randomization
- **Email sending** via SMTP or SendGrid
- **OTP expiration** (10 minutes for email verification, 30 minutes for password reset)
- **Rate limiting** (max 3 requests per 2 minutes)
- **Used OTP tracking** to prevent reuse
- **Beautiful HTML email templates**
- **Database storage** with automatic cleanup

### 🔐 Security Features
- OTP codes are 6 random digits
- Rate limiting prevents brute force attacks
- Expired OTPs are automatically cleaned up
- OTPs marked as used after verification
- Email not exposed in error messages
- Password reset requests require email ownership verification

## Setup Instructions

### 1. Backend Configuration

#### Step 1a: Environment Variables
Add these to your `.env` file:

```env
# Email Provider Configuration
# Options: 'smtp', 'sendgrid', 'test'
EMAIL_PROVIDER=smtp

# SMTP Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@inventorymanager.com

# OR SendGrid Configuration (if using SendGrid)
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 1b: For Gmail SMTP
1. Enable 2-Factor Authentication on Gmail
2. Generate an App Password:
   - Go to Google Account > Security
   - Click "App passwords"
   - Select Mail and Windows Computer
   - Copy the generated password
   - Use this password in SMTP_PASSWORD

#### Step 1c: For SendGrid
1. Create a SendGrid account (https://sendgrid.com)
2. Create an API key
3. Add to .env: `SENDGRID_API_KEY=your-api-key`

#### Step 1d: Database Migration
Run the migration to create OTP tables:

```bash
# Using Prisma
npx prisma migrate dev --name add_email_otp_support

# Or manually with SQL
psql your_database_url < prisma/migrations/add_email_otp.sql
```

Update Prisma client:
```bash
npm run prisma:generate
```

#### Step 1e: Install Dependencies
```bash
cd inventory-backend
npm install
```

### 2. Frontend Configuration

The mobile app already has all necessary dependencies. Just update:

```bash
cd Orbis
npm install
```

## API Endpoints

### Request OTP
**Endpoint:** `POST /auth/request-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "type": "email_verification" // or "password_reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to user@example.com. It will expire in 10 minutes."
}
```

**Error Cases:**
- Invalid email format
- Rate limited (too many requests)
- Email service failure

### Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "email_verification" // or "password_reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Cases:**
- Invalid OTP format
- OTP expired
- OTP already used
- OTP doesn't match

### Sign Up with Email Verification
**Endpoint:** `POST /auth/signup`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "otp_code": "123456" // Optional - only if email pre-verified
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "emailVerified": true,
  "expiresIn": 3600,
  "requiresOnboarding": true
}
```

### Request Password Reset
**Endpoint:** `POST /auth/request-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "type": "password_reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If this email is registered, you will receive a password reset code."
}
```

### Verify Password Reset OTP
**Endpoint:** `POST /auth/verify-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "password_reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified. You can now reset your password.",
  "userId": "uuid"
}
```

### Reset Password
**Endpoint:** `POST /auth/reset-password`

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

## Frontend Usage

### OTP Request Flow
```jsx
import { OtpRequestScreen } from './components/auth/OtpVerification';

<OtpRequestScreen
  onOtpRequested={(email) => {
    // Show OTP verification screen
  }}
  otpType="email_verification"
/>
```

### OTP Verification Flow
```jsx
import { OtpVerificationScreen } from './components/auth/OtpVerification';

<OtpVerificationScreen
  email="user@example.com"
  otpType="email_verification"
  onVerificationSuccess={() => {
    // Proceed to signup
  }}
  onRequestNewCode={async () => {
    // Call request-otp endpoint
    await authService.requestOtp(email, 'email_verification');
  }}
/>
```

## Rate Limiting

### Email Verification
- **Max requests:** 3 per 2 minutes
- **Cooldown period:** 15 minutes after limit reached

### Password Reset
- **Max requests:** 3 per 2 minutes
- **Cooldown period:** 30 minutes after limit reached

## OTP Expiration Times

- **Email Verification:** 10 minutes
- **Password Reset:** 30 minutes
- **Cleanup:** Expired OTPs automatically deleted periodically

## Testing

### Test Mode (Development)
Set `EMAIL_PROVIDER=test` in `.env` to log OTPs to console instead of sending emails.

**Console Output:**
```
[TEST MODE] OTP Email to user@example.com: 123456
```

### Manual Testing with cURL

1. **Request OTP:**
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "type": "email_verification"
  }'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp_code": "123456",
    "type": "email_verification"
  }'
```

3. **Sign Up with Verification:**
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

## Email Templates

### Email Verification Email
- Subject: "Your Email Verification Code"
- Contains: 6-digit OTP, 10-minute expiration notice
- Links: None (code-based only)

### Password Reset Email
- Subject: "Password Reset Request"
- Contains: 6-digit OTP, 30-minute expiration notice, security warning
- Links: None (code-based only)

## Troubleshooting

### Emails not being sent

**Problem:** SMTP connection error
```
Error: connect ECONNREFUSED 127.0.0.1:587
```

**Solution:**
1. Check SMTP credentials in .env
2. Verify SMTP host and port are correct
3. For Gmail, ensure App Password is used (not regular password)
4. Check firewall/network access to SMTP server

**Problem:** 550 5.7.57 Client not authenticated
```
Error: 550 5.7.57 Client was not authenticated
```

**Solution:**
1. Gmail: Regenerate App Password
2. Other providers: Verify credentials are correct

### OTP Not Received

1. Check spam folder
2. Verify email address is correct
3. Check server logs for sending errors
4. Verify EMAIL_FROM is valid

### Rate Limiting Issues

**Problem:** "Too many OTP requests"
- Wait 15 minutes for email verification
- Wait 30 minutes for password reset
- Or check logs for suspicious activity

## Cleanup and Maintenance

### Manual OTP Cleanup
The system automatically cleans up expired OTPs, but you can trigger it:

```bash
curl -X POST http://localhost:3000/auth/cleanup-otps \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Database Queries for Debugging

```sql
-- View all pending OTPs for an email
SELECT * FROM otp_tokens 
WHERE email = 'user@example.com' 
AND is_used = false 
AND expires_at > NOW();

-- View used OTPs
SELECT * FROM otp_tokens 
WHERE email = 'user@example.com' 
AND is_used = true;

-- Count OTP requests per email (last hour)
SELECT email, COUNT(*) as attempts 
FROM otp_tokens 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY email;
```

## Production Checklist

- [ ] EMAIL_PROVIDER is set to 'smtp' or 'sendgrid' (not 'test')
- [ ] SMTP credentials are correct and use App Passwords for Gmail
- [ ] EMAIL_FROM is set to a valid email address
- [ ] JWT_SECRET is strong and unique
- [ ] Database migrations are applied
- [ ] Email sending is tested in staging
- [ ] Rate limiting is appropriate for your use case
- [ ] Error messages don't reveal sensitive information
- [ ] Emails are being delivered to inbox (not spam)
- [ ] OTP expiration times are appropriate
- [ ] Monitoring alerts for email delivery failures

## Advanced Configuration

### Custom OTP Length
Edit `OTP_LENGTH` in [otp.service.ts](../src/auth/otp.service.ts):
```typescript
private readonly OTP_LENGTH = 6; // Change to 4, 5, 7, 8, etc.
```

### Custom Expiration Times
Edit `OTP_EXPIRY_MINUTES` in [otp.service.ts](../src/auth/otp.service.ts):
```typescript
private readonly OTP_EXPIRY_MINUTES = {
  email_verification: 10,  // Change as needed
  password_reset: 30,      // Change as needed
};
```

### Custom Email Templates
Edit email templates in [email.service.ts](../src/auth/email.service.ts):
- `generateOtpEmailTemplate()`
- `generatePasswordResetEmailTemplate()`

## Support

For issues:
1. Check logs for error messages
2. Verify environment variables are set
3. Test email delivery separately
4. Check rate limiting constraints
5. Review database schema is correct
