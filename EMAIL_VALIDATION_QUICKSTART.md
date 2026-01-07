# Email Validation Signup - Quick Start

## What Changed?

**Old Flow (OTP):**
User enters email → OTP sent → User enters 6-digit code → Account created

**New Flow (Abstract API + Brevo):**
User enters email → Abstract API validates → Brevo sends verification link → User clicks link → Account verified

## Why This Approach?

✅ **Better UX** - Click email link instead of manual code entry
✅ **Better Validation** - Abstract API detects disposable emails
✅ **Less Friction** - No code copying/pasting
✅ **Professional** - Beautiful email templates
✅ **More Reliable** - Industry-standard email APIs

## Setup (5 Minutes)

### 1. Get API Keys

**Abstract API** (Free 100 requests/month)
```
Go to: https://www.abstractapi.com/api/email-validation
- Sign up (free tier available)
- Copy API key
- Add to .env: ABSTRACT_API_KEY=your_key_here
```

**Brevo** (Free 300 emails/day)
```
Go to: https://www.brevo.com
- Sign up (free tier available)
- Generate API key
- Add to .env: BREVO_API_KEY=your_key_here
```

### 2. Update Environment
```bash
cd inventory-backend
cp .env.example .env
```

Add to `.env`:
```env
ABSTRACT_API_KEY=your-abstract-api-key
BREVO_API_KEY=your-brevo-api-key
APP_URL=https://app.inventorymanager.com
EMAIL_FROM=noreply@inventorymanager.com
EMAIL_FROM_NAME=Inventory Manager
```

### 3. Run Database Migration
```bash
npx prisma migrate dev --name add_email_validation
```

### 4. Install & Start
```bash
npm install
npm run start:dev
```

## API Endpoints

### Signup (Step 1)
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": { "id": "...", "email": "...", "name": "..." },
  "message": "Check your email to verify your account",
  "verificationEmailSent": true,
  "requiresEmailVerification": true
}
```

**What happens:**
1. Email validated with Abstract API
2. User account created
3. Verification token generated
4. Email sent via Brevo
5. User receives verification email

### Verify Email (Step 2)
```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "AbCdEfGhIjKlMnOpQrStUvWxYz123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified! You can now log in.",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### Resend Verification Email
```bash
curl -X POST http://localhost:3000/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent!"
}
```

## Email Validation Rules

Abstract API rejects:
- ❌ Invalid format (`notanemail`)
- ❌ Disposable emails (temp-mail, guerrillamail, etc.)
- ❌ Undeliverable domains (invalid MX records)
- ❌ Low quality score (< 0.5)

Accepts:
- ✅ Valid format with proper domain
- ✅ Deliverable email servers
- ✅ Professional email addresses
- ✅ Gmail, Outlook, company domains

## Frontend Implementation

### 1. Update Auth Service
```javascript
// src/services/api/authService.js

export const signUpWithEmail = async (email, password, name) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return response.json();
};

export const verifyEmail = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return response.json();
};

export const resendVerificationEmail = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
};
```

### 2. Create Signup Component
See `FRONTEND_EMAIL_VALIDATION_GUIDE.md` for full component code

### 3. Create Email Verification Component
See `FRONTEND_EMAIL_VALIDATION_GUIDE.md` for full component code

## Database Changes

### New Tables
- `email_verification_logs` - Tracks verification tokens and attempts

### Updated Columns
```sql
-- Added to users table:
verification_token VARCHAR
verification_token_expires_at TIMESTAMP
```

## Email Template Preview

**Subject:** "Verify Your Email Address"

**Content:**
```
Hi John,

Thank you for signing up for Inventory Manager! 
To complete your registration, please verify your email address.

[Verify Email Address] <-- Clickable button with verification link

This verification link expires in 24 hours.

Best regards,
Inventory Manager Team
```

## Testing

### Test Email (Abstract API accepts)
```
user@gmail.com
john@company.com
test@outlook.com
```

### Test Email (Abstract API rejects)
```
user@tempmail.com       (disposable)
admin@domain.com        (role email)
user@invalid-xyz.abc    (undeliverable)
notanemail              (invalid format)
```

### Verification Token Test
```javascript
// In signup response, user receives token in email
// Use that token to test verification:

const token = "AbCdEfGhIjKlMnOpQrStUvWxYz123456"; // from email
await verifyEmail(token);
```

## Common Issues & Solutions

### "Email validation failed"
- Check ABSTRACT_API_KEY is set
- Verify key is correct (no spaces)
- Check API quota not exceeded

### "Email verification failed"
- Check BREVO_API_KEY is set
- Verify sender email is verified in Brevo
- Check Brevo account not rate-limited

### "Token not found"
- Token may be expired (24 hour limit)
- Token may already be used
- User should click "Resend Email"

### "Email already exists"
- This email already signed up
- User should use "Forgot Password" or login

## Comparison: OTP vs Email Link

| Feature | OTP | Email Link |
|---------|-----|-----------|
| User Experience | Manual code entry | Click link |
| Verification Time | Instant | Requires email |
| Re-verification | Resend OTP | Resend link |
| Expiration | 10 minutes | 24 hours |
| Cost | Free (in-house) | ~$20/month (Brevo) |
| Deliverability | 100% (system) | 95%+ (email) |
| Spam Risk | Low | Medium |

## Production Checklist

- [ ] Abstract API key configured
- [ ] Brevo API key configured
- [ ] Email sender verified in Brevo
- [ ] APP_URL set to your domain
- [ ] Database migration run
- [ ] Frontend components implemented
- [ ] Error logging configured
- [ ] Email templates customized
- [ ] Deep linking configured (mobile)
- [ ] Testing complete
- [ ] Monitoring alerts set up

## Next Steps

1. **Get API Keys** (~5 min)
   - Abstract API key
   - Brevo API key

2. **Configure Environment** (~2 min)
   - Update .env

3. **Run Migration** (~1 min)
   - `npx prisma migrate dev`

4. **Test Backend** (~10 min)
   - Use curl examples above
   - Verify email delivery in Brevo

5. **Implement Frontend** (~30 min)
   - Create signup screen
   - Create verification screen
   - Update navigation

6. **End-to-End Testing** (~20 min)
   - Full signup flow
   - Email verification
   - Error cases

7. **Deploy to Staging** 
   - Test in production-like environment
   - Verify email delivery
   - Check error logging

**Total Setup Time: ~1-2 hours**

## Support

**Questions about Abstract API?**
- Docs: https://www.abstractapi.com/api/email-validation
- Email: support@abstractapi.com

**Questions about Brevo?**
- Docs: https://developers.brevo.com/
- Help Center: https://help.brevo.com

**Questions about the implementation?**
- See `EMAIL_VALIDATION_SIGNUP.md` for detailed docs
- See `FRONTEND_EMAIL_VALIDATION_GUIDE.md` for component code

## Cost Breakdown

- **Abstract API:** $9-49/month (validation)
- **Brevo:** €20+/month (email sending)
- **Total:** ~$70-100/month

Free tiers available:
- Abstract API: 100 validations/month
- Brevo: 300 emails/day (9,000/month)

Great for testing before going live!
