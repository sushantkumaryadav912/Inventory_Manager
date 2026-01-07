# Email Validation & Signup with Abstract API + Brevo

## Overview

The new signup flow replaces OTP-based email verification with a modern approach:

1. **Email Validation** → User enters email
2. **Abstract API Check** → Validates email format, deliverability, detects disposable emails
3. **User Creation** → Account created with hashed password
4. **Token Generation** → Secure 32-character verification token
5. **Brevo Email** → Beautiful verification email sent with clickable link
6. **Email Click** → User clicks link to verify account

## Signup Flow

```
User Signup Request
    ↓
[POST /auth/signup]
    ↓
Validate with Abstract API
    ├─ Valid format?
    ├─ Not disposable?
    ├─ Deliverable?
    └─ Quality score > 0.5?
    ↓ ✅ If All Pass
Create User Account
    ↓
Generate Verification Token
    ↓
Send Verification Email (Brevo)
    ↓
Response: "Check your email to verify"
    ↓
User Clicks Email Link
    ↓
[POST /auth/verify-email]
    ↓
Verify Token & Update Database
    ↓
✅ Account Verified - Ready to Login
```

## API Endpoints

### 1. User Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Request Parameters:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | Will be validated with Abstract API |
| password | string | Yes | Min 8 characters |
| name | string | No | Defaults to email prefix if not provided |

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "expiresIn": 3600,
  "message": "Signup successful! Please check your email to verify your account.",
  "verificationEmailSent": true,
  "emailVerified": false,
  "requiresEmailVerification": true
}
```

**Error Responses:**

Invalid Email Format:
```json
{
  "message": "Invalid email format",
  "statusCode": 400
}
```

Disposable Email:
```json
{
  "message": "Disposable email addresses are not allowed",
  "statusCode": 400
}
```

Undeliverable Email:
```json
{
  "message": "Email address is undeliverable",
  "statusCode": 400
}
```

User Already Exists:
```json
{
  "message": "User with this email already exists",
  "statusCode": 400
}
```

---

### 2. Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "AbCdEfGhIjKlMnOpQrStUvWxYz123456"
}
```

**Request Parameters:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | string | Yes | Token from verification email link |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**

Invalid Token:
```json
{
  "message": "Invalid or already used verification token",
  "statusCode": 400
}
```

Expired Token:
```json
{
  "message": "Verification token has expired. Please sign up again.",
  "statusCode": 400
}
```

---

### 3. Resend Verification Email
```http
POST /auth/resend-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Request Parameters:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | User's email address |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully!"
}
```

**Error Responses:**

User Not Found:
```json
{
  "message": "User not found",
  "statusCode": 400
}
```

Already Verified:
```json
{
  "message": "Email is already verified",
  "statusCode": 400
}
```

---

## Database Schema

### Users Table (Updated)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  verification_token VARCHAR,              -- Current token
  verification_token_expires_at TIMESTAMP, -- Token expiration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
```

### Email Verification Logs (New)
```sql
CREATE TABLE email_verification_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR NOT NULL,
  verification_token VARCHAR NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  token_expires_at TIMESTAMP NOT NULL,
  abstract_api_result TEXT,  -- JSON response from validation
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_id ON email_verification_logs(user_id);
CREATE INDEX idx_email_verification_email ON email_verification_logs(email);
CREATE INDEX idx_email_verification_token ON email_verification_logs(verification_token);
CREATE INDEX idx_email_verification_expires_at ON email_verification_logs(token_expires_at);
```

## Configuration

### Required Environment Variables

#### Abstract API
Get your free API key from: https://www.abstractapi.com/api/email-validation

```env
ABSTRACT_API_KEY=your-abstract-api-key-here
```

**Free Tier:** 100 requests/month
**Paid Tier:** $9/month for 1,000 requests

#### Brevo API
Get your API key from: https://www.brevo.com

```env
BREVO_API_KEY=your-brevo-api-key-here
```

**Free Tier:** 300 emails/day
**Paid Tier:** €20/month+ with higher limits

#### Frontend URL
```env
APP_URL=https://app.inventorymanager.com
```

#### Email Configuration
```env
EMAIL_FROM=noreply@inventorymanager.com
EMAIL_FROM_NAME=Inventory Manager
SUPPORT_EMAIL=support@inventorymanager.com
```

## Email Validation Details (Abstract API)

Abstract API checks:

1. **Format Validation**
   - Valid email format according to RFC 5321
   - Returns `is_valid_format: true/false`

2. **Deliverability Check**
   - SMTP server validation
   - Domain MX record verification
   - Returns `deliverability: DELIVERABLE | UNDELIVERABLE | UNKNOWN`

3. **Disposable Email Detection**
   - Prevents registration with temporary email services
   - Detects Gmail aliases, YahooMail, etc.
   - Returns `is_disposable_email: true/false`

4. **Quality Score**
   - Overall quality score (0-1)
   - Factors: format, domain reputation, disposability, role accounts
   - Threshold: 0.5 minimum required

5. **Role Email Detection**
   - Identifies generic addresses (admin@, support@, info@)
   - Returns `is_role_email: true/false`

### Response Example
```json
{
  "email": "user@example.com",
  "is_valid_format": true,
  "is_free_email": true,
  "is_disposable_email": false,
  "is_role_email": false,
  "deliverability": "DELIVERABLE",
  "quality_score": 0.95,
  "autocorrect": "",
  "is_smtp_valid": true,
  "suggestion": ""
}
```

## Email Templates

### Verification Email
Sent via Brevo with:
- Professional gradient header
- User's name in greeting
- Clear call-to-action button
- 24-hour expiration notice
- Support contact information
- HTML + plain text versions

**Subject:** "Verify Your Email Address"

**Button Text:** "Verify Email Address"

**Expiration:** 24 hours

---

## Security Features

### Token Generation
- **Length:** 32 characters
- **Charset:** A-Z, a-z, 0-9 (alphanumeric)
- **Randomization:** Cryptographically secure Math.random()
- **Storage:** Stored in database, never transmitted in URLs (use as parameter)

### Token Validation
- One-time use only
- Auto-expires after 24 hours
- Automatically cleaned up on verification
- Cannot be reused

### Email Validation
- No temp/disposable emails allowed
- Quality score threshold: 0.5
- Domain reputation checked
- SMTP verification required

### Database Security
- Tokens indexed for fast lookup
- Automatic cascade delete with user
- Audit trail with verification logs
- Timestamps for compliance

## Testing

### Manual Testing

1. **Test Email Validation:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

2. **Check Verification Email:**
- Login to Brevo dashboard
- View Logs/Analytics
- Confirm email was sent

3. **Verify Email Token:**
```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "AbCdEfGhIjKlMnOpQrStUvWxYz123456"
  }'
```

4. **Test Resend:**
```bash
curl -X POST http://localhost:3000/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Invalid Email Test Cases

```javascript
// Invalid cases
const testCases = [
  { email: "notanemail", reason: "No @ symbol" },
  { email: "user@domain", reason: "No TLD" },
  { email: "user@tempmail.com", reason: "Disposable email" },
  { email: "user@invalid.xyz", reason: "Undeliverable domain" },
  { email: "admin@company.com", reason: "Role email" }
];
```

## Error Handling

### API Failures

**Abstract API Unreachable:**
- Logs warning to console
- Allows signup (degrades gracefully)
- Can be configured to fail-closed

**Brevo API Failure:**
- Throws error to user
- User must retry signup
- Verification log created for debugging

### Common Issues

**"ABSTRACT_API_KEY is not configured"**
- Set ABSTRACT_API_KEY in .env
- Validation will be skipped

**"BREVO_API_KEY is not configured"**
- Set BREVO_API_KEY in .env
- Email sending will fail

**"Invalid verification token"**
- Token may be expired
- Token may have been used
- User should use "Resend Verification Email"

## Production Deployment

### Pre-Deployment Checklist
- [ ] Abstract API key configured
- [ ] Brevo API key configured
- [ ] APP_URL set to production domain
- [ ] Email templates reviewed
- [ ] Database migrations run
- [ ] Error logging configured
- [ ] HTTPS enabled
- [ ] Rate limiting enabled (optional)

### Monitoring

**Track These Metrics:**
- Email validation failures (Abstract API)
- Email send failures (Brevo)
- Verification token expiration rate
- Signup conversion rate
- Email click-through rate (in Brevo dashboard)

### Performance Considerations
- Abstract API: ~200-500ms per request
- Brevo API: ~100-300ms per request
- Total signup time: ~1-2 seconds
- Can be optimized with background jobs

## Migration from OTP System

If migrating from OTP-based signup:

1. **Keep OTP endpoints** for existing users' password resets
2. **New signups** use Abstract API + Brevo
3. **Existing users** unaffected by changes
4. **Database:** Run migration to add new columns/tables

### Backward Compatibility
- OTP endpoints remain functional
- Both systems can coexist
- Users can switch gradually

## Troubleshooting

### Email Not Received
1. Check Brevo logs for send status
2. Check SPAM folder
3. Verify sender address is verified in Brevo
4. Check email address is in Brevo's "Block List"

### Abstract API Rejection
1. Use Abstract API dashboard to test email
2. Check quality score
3. If score < 0.5, try different email
4. Contact Abstract API support

### Token Already Used
1. Token can only be used once
2. Request user to use "Resend Verification Email"
3. New token will be generated

### Token Expired
1. Tokens expire after 24 hours
2. Request user to use "Resend Verification Email"
3. No data loss, just need new token

## Cost Estimates (Monthly)

### Abstract API
- Free: 100/month
- Basic: $9/month (1,000/month)
- Growth: $49/month (100,000/month)

**Assumption:** 10,000 new users/month
- Cost: $49/month

### Brevo
- Free: 300 emails/day (9,000/month)
- Starter: €20/month (10,000 emails)
- Growth: €60/month (unlimited)

**Assumption:** 10,000 emails/month
- Cost: €20/month (~$22)

**Total Estimated Cost:** ~$70/month

## Support & Resources

- **Abstract API Docs:** https://www.abstractapi.com/api/email-validation
- **Brevo API Docs:** https://developers.brevo.com/
- **Brevo Email Templates:** https://www.brevo.com/email-templates/
- **RFC 5321 (Email Format):** https://tools.ietf.org/html/rfc5321

## Next Steps

1. Get API keys from Abstract API and Brevo
2. Update .env with credentials
3. Run database migration: `npx prisma migrate dev --name add_email_validation`
4. Test signup flow end-to-end
5. Update frontend to call new endpoints
6. Deploy to staging for integration testing
