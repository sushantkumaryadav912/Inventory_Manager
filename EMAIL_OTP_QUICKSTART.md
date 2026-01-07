# Email OTP - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd inventory-backend
npm install
```

### Step 2: Add Environment Variables
Create `.env` in `inventory-backend/`:

```env
# Use test mode to see OTPs in console (development)
EMAIL_PROVIDER=test

# Or setup real email
# EMAIL_PROVIDER=smtp
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

JWT_SECRET=your-secret-key-here
EMAIL_FROM=noreply@inventorymanager.com
```

### Step 3: Run Database Migration
```bash
npx prisma migrate dev --name add_email_otp_support
```

### Step 4: Start Backend
```bash
npm start:dev
```

### Step 5: Test in 30 seconds
```bash
# 1. Request OTP (returns 200)
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "email_verification"
  }'

# Check console for OTP code (in test mode)
# Output: [TEST MODE] OTP Email to test@example.com: 123456

# 2. Verify OTP (use code from console)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp_code": "123456",
    "type": "email_verification"
  }'

# 3. Sign up with verified email
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "Test User",
    "otp_code": "123456"
  }'
```

## API Overview

| Endpoint | Purpose | When to Use |
|----------|---------|-------------|
| `POST /auth/request-otp` | Send OTP to email | Before signup or password reset |
| `POST /auth/verify-otp` | Validate OTP code | After user enters code |
| `POST /auth/signup` | Register user | After email verified with OTP |
| `POST /auth/reset-password` | Change password | After password reset OTP verified |

## Features Overview

### ✅ What's Included
- 6-digit OTP generation
- Email sending (SMTP/SendGrid)
- Auto-expiration (10-30 min)
- Rate limiting (prevent brute force)
- Beautiful email templates
- Mobile-friendly OTP input screen

### 🔐 Security
- OTP codes are 6 random digits
- Max 3 requests per 2 minutes
- Expiration prevents replay attacks
- One-time use only

## Configuration Options

### Test Mode (Development)
```env
EMAIL_PROVIDER=test
```
OTPs appear in console logs. Perfect for testing without email setup.

### Gmail SMTP
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=YOUR_APP_PASSWORD
```

**Important:** Use App Password, not your regular Gmail password!
1. Go to Google Account Security
2. Enable 2-Factor Authentication
3. Generate App Password for Mail
4. Use that 16-character password

### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
EMAIL_FROM=your-verified-email@domain.com
```

## Mobile App Integration

### Request OTP
```jsx
import { OtpRequestScreen } from './components/auth/OtpVerification';

<OtpRequestScreen
  onOtpRequested={(email) => {
    // Show verification screen
  }}
/>
```

### Verify OTP
```jsx
import { OtpVerificationScreen } from './components/auth/OtpVerification';

<OtpVerificationScreen
  email="user@example.com"
  onVerificationSuccess={() => {
    // Proceed to password setup
  }}
  onRequestNewCode={async () => {
    await authService.requestOtp(email);
  }}
/>
```

## Common Issues & Solutions

### "SMTP connection refused"
- Check SMTP host and port are correct
- For Gmail: Ensure App Password (not regular password) is used
- Ensure SMTP_USER and SMTP_PASSWORD match

### "Emails not being sent"
- Check EMAIL_PROVIDER is not set to 'test'
- Verify SMTP credentials are correct
- Check logs for specific error message

### "Too many requests"
- OTP rate limited to 3 per 2 minutes
- Wait 15 minutes to retry (email verification)
- Wait 30 minutes to retry (password reset)

### "Invalid or expired OTP"
- Check OTP hasn't expired (10 min for email, 30 min for password)
- Verify user entered code correctly (case-sensitive)
- Request new code and try again

## Database Schema

### users table
```
- email_verified: BOOLEAN (default: false)
- email_verified_at: TIMESTAMP
```

### otp_tokens table
```
- id: UUID
- user_id: UUID
- email: VARCHAR
- otp_code: VARCHAR
- type: VARCHAR ('email_verification' or 'password_reset')
- is_used: BOOLEAN
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
```

## Email Expiration Times
- **Email Verification:** 10 minutes
- **Password Reset:** 30 minutes

## Next: Configure for Real Email

When ready to use real email service:

1. Choose provider: Gmail SMTP or SendGrid
2. Get credentials
3. Update `.env` file
4. Test with real email
5. Deploy to production

## Production Checklist

- [ ] EMAIL_PROVIDER set to 'smtp' or 'sendgrid'
- [ ] Email credentials configured
- [ ] JWT_SECRET is strong and unique
- [ ] Database migrated
- [ ] Test email delivery works
- [ ] Rate limiting configured appropriately
- [ ] Monitoring/alerts for email failures

## Links to Full Documentation

- **Setup Details:** `EMAIL_OTP_SETUP.md`
- **Implementation Details:** `EMAIL_OTP_IMPLEMENTATION.md`
- **Auth Migration:** `CUSTOM_AUTH_MIGRATION.md`

## Questions?

1. Check full setup guide: `EMAIL_OTP_SETUP.md`
2. Review code comments in source files
3. Check server logs for errors
4. Test with `EMAIL_PROVIDER=test` mode first
