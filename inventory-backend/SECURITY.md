# Security Guidelines

This document outlines security best practices and configurations for the Inventory Backend.

## Environment Variables

### Never Commit These
- `.env` files
- Database credentials
- API keys
- JWT secrets
- Any sensitive configuration

### Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEON_JWKS_URL` | ✅ Yes | Neon Auth JWKS endpoint | `https://xxx.neon.tech/.well-known/jwks.json` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `ALLOWED_ORIGINS` | ⚠️ Prod only | Allowed CORS origins | `https://yourdomain.com` |
| `PORT` | ⚠️ Optional | Server port | `3000` |

## CORS Configuration

### Development
- All origins allowed (`origin: true`)
- Useful for local testing

### Production
- **MUST** specify exact origins in `ALLOWED_ORIGINS`
- Comma-separated list
- Include protocol (https://)
- No wildcards (*)
- No trailing slashes

**Example:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Database Security

### Connection Strings
- Always use environment variables
- Enable SSL in production
- Use connection pooling (configured automatically)
- Never log connection strings

### Pool Configuration
```typescript
max: 20,                      // Maximum connections
idleTimeoutMillis: 30000,     // Close idle connections after 30s
connectionTimeoutMillis: 10000 // Timeout connection attempts after 10s
```

## Authentication & Authorization

### JWT Strategy
- Uses RS256 algorithm
- Validates tokens against JWKS endpoint
- Caches keys for performance
- Rate limits JWKS requests

### Guards
1. **NeonAuthGuard**: Validates JWT token
2. **ShopGuard**: Verifies user has access to shop
3. **RolesGuard**: Checks user role permissions

### Protected Routes
All routes require authentication unless explicitly public.

## HTTP Security Headers

### Helmet Configuration
Configured with:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### CSP Directives
```javascript
{
  defaultSrc: ["'self'"],           // Only load from same origin
  styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
  imgSrc: ["'self'", "data:", "https:"],   // Allow images from https
  scriptSrc: ["'self'"]             // Only scripts from same origin
}
```

## Error Handling

### Production Mode
- Stack traces hidden from clients
- Errors logged to stdout (Render captures these)
- Generic error messages sent to clients

### Development Mode
- Full stack traces included
- Detailed error messages
- Request context in logs

### Logging Format
```json
{
  "level": "error",
  "statusCode": 500,
  "message": "Error description",
  "path": "/api/endpoint",
  "method": "GET",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "requestId": "uuid",
  "stack": "..."
}
```

## Rate Limiting

### JWKS Requests
- 10 requests per minute to JWKS endpoint
- Caching enabled (10 minutes)

### Recommendations
Consider adding:
- API rate limiting per user
- Request throttling
- DDoS protection (via Render or Cloudflare)

## Input Validation

### Zod Schemas
All request bodies validated with Zod schemas:
- Type validation
- Format validation
- Required field checking
- Custom validation rules

### Example
```typescript
const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
});
```

## SQL Injection Prevention

### Prisma ORM
- Parameterized queries (automatic)
- Type-safe query builder
- No raw SQL (use $queryRaw with caution)

### If Using Raw SQL
```typescript
// ✅ Good - Parameterized
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;

// ❌ Bad - Vulnerable to SQL injection
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);
```

## Password & Secrets Management

### Never Do This
```typescript
// ❌ Hardcoded secrets
const apiKey = 'sk-1234567890abcdef';
const dbPassword = 'mypassword123';
```

### Always Do This
```typescript
// ✅ Environment variables
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

## Dependencies

### Keep Updated
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Regular Checks
- Run `npm audit` before each deployment
- Review security advisories
- Update critical packages immediately

## Monitoring & Logging

### What to Log
- Authentication attempts
- Authorization failures
- Database errors
- API errors (5xx status codes)
- Unusual activity patterns

### What NOT to Log
- Passwords
- JWT tokens
- Credit card numbers
- Personal identification numbers
- Full database connection strings

### Example Safe Logging
```typescript
// ✅ Good
logger.log(`User ${userId} accessed shop ${shopId}`);

// ❌ Bad
logger.log(`User login: ${email}, password: ${password}`);
```

## Deployment Security

### Pre-Deployment Checklist
- [ ] `NODE_ENV=production`
- [ ] All environment variables set in Render
- [ ] `ALLOWED_ORIGINS` configured
- [ ] Database uses SSL
- [ ] No secrets in code
- [ ] No `.env` files committed
- [ ] Dependencies updated
- [ ] `npm audit` clean
- [ ] Error handling tested

### Post-Deployment Checklist
- [ ] Health check responding
- [ ] CORS working correctly
- [ ] Authentication working
- [ ] Database connected
- [ ] Logs monitoring setup
- [ ] Error tracking configured
- [ ] SSL certificate valid

## Incident Response

### If Credentials Leaked
1. **Immediately** rotate all affected credentials
2. Update environment variables in Render
3. Redeploy application
4. Review logs for unauthorized access
5. Document incident

### If Vulnerability Discovered
1. Assess severity and impact
2. Patch vulnerability immediately
3. Test fix thoroughly
4. Deploy fix
5. Monitor for exploitation attempts
6. Update security documentation

## Compliance

### Data Protection
- User data encrypted in transit (HTTPS)
- User data encrypted at rest (PostgreSQL)
- Minimal data collection
- Clear data retention policies

### GDPR Considerations
- User consent mechanisms
- Data export capabilities
- Data deletion capabilities
- Privacy policy documentation

## Security Contacts

### Reporting Security Issues
- **Email**: security@yourdomain.com (update this)
- **Response Time**: 24-48 hours
- **Disclosure**: Responsible disclosure policy

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

## Regular Security Reviews

### Weekly
- Review application logs
- Check for unusual activity
- Monitor error rates

### Monthly
- Run `npm audit`
- Review access logs
- Update dependencies
- Test backup/restore procedures

### Quarterly
- Full security audit
- Penetration testing
- Review and update security policies
- Team security training

---

Last Updated: January 2025
Version: 1.0
