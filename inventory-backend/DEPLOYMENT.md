# Deployment Guide for Render

This guide covers deploying the Inventory Backend to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. A PostgreSQL database (can be created on Render)
3. Your Neon Auth JWKS URL

## Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Choose a name for your database
3. Select region closest to your users
4. Create Database
5. Copy the **Internal Database URL** (starts with `postgresql://`)

## Step 2: Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your Git repository
3. Configure the service:
   - **Name**: `inventory-backend` (or your preferred name)
   - **Region**: Same as your database
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `inventory-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Choose based on your needs

## Step 3: Environment Variables

Add the following environment variables in Render:

| Variable | Required | Value | Description |
|----------|----------|-------|-------------|
| `DATABASE_URL` | ✅ Yes | `postgresql://...` | Your PostgreSQL connection string (from Step 1) |
| `NODE_ENV` | ✅ Yes | `production` | Sets the environment to production |
| `NEON_JWKS_URL` | ✅ Yes | `https://...` | Your Neon Auth JWKS endpoint |
| `ALLOWED_ORIGINS` | ⚠️ Optional | `https://yourdomain.com` | Comma-separated allowed CORS origins (if empty, allows all origins) |
| `PORT` | ⚠️ Auto | (auto-set by Render) | Render sets this automatically |

### Example ALLOWED_ORIGINS

```
https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies
   - Generate Prisma Client
   - Build TypeScript code
   - Start the application

## Step 5: Verify Deployment

Once deployed, test your endpoints:

### Health Check
```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "uptime": 123.456
}
```

### Root Endpoint
```bash
curl https://your-app.onrender.com/
```

Expected response:
```json
{
  "name": "Inventory Backend API",
  "version": "1.0.0",
  "status": "running",
  "environment": "production"
}
```

## Troubleshooting

### Build Failures

**Issue**: Prisma Client generation fails
```bash
# Check if DATABASE_URL is set correctly
echo $DATABASE_URL
```

**Solution**: Ensure DATABASE_URL is set in environment variables before build

---

**Issue**: TypeScript compilation errors
```bash
# Run locally to check
npm run build
```

**Solution**: Fix TypeScript errors in your code

### Runtime Errors

**Issue**: Database connection fails
- Verify DATABASE_URL is correct
- Check if database is accessible from Render
- Ensure SSL is enabled for production databases

**Issue**: CORS errors
- Add your frontend domain to ALLOWED_ORIGINS
- Ensure protocol (https) is included
- Verify no trailing slashes

**Issue**: Authentication errors
- Verify NEON_JWKS_URL is correct
- Test JWKS endpoint accessibility
- Check JWT token format

### Performance Issues

**Issue**: Slow database queries
- Check Render logs for query performance
- Consider upgrading database plan
- Review and optimize slow queries

**Issue**: Memory issues
- Monitor memory usage in Render dashboard
- Consider upgrading instance size
- Check for memory leaks in application

## Security Checklist

- [ ] `NODE_ENV` set to `production`
- [ ] `ALLOWED_ORIGINS` configured with actual domains (no wildcards)
- [ ] Database uses SSL connection
- [ ] All sensitive data in environment variables
- [ ] Health check endpoint accessible
- [ ] Error logs monitored regularly

## Monitoring

### View Logs
```bash
# In Render Dashboard
Logs → Your Service → Live Logs
```

### Key Metrics to Monitor
- Response times
- Error rates
- Database connection pool usage
- Memory usage
- CPU usage

## Automatic Deployments

Render automatically deploys when you push to your connected branch.

To disable auto-deploy:
1. Go to Settings
2. Scroll to Auto-Deploy
3. Toggle off

## Custom Domains

1. Go to Settings → Custom Domains
2. Add your domain
3. Configure DNS records as instructed
4. Update ALLOWED_ORIGINS to include your custom domain

## Scaling

### Vertical Scaling
Upgrade your instance type in Settings → Instance Type

### Horizontal Scaling
Not directly supported on free/starter plans. Consider:
- Upgrading to Team plan for auto-scaling
- Using a load balancer

## Database Migrations

When you need to update the database schema:

1. Update `prisma/schema.prisma`
2. Commit and push changes
3. Render will automatically:
   - Run `npm run build` (includes `prisma generate`)
   - Restart with new schema

For manual migrations:
```bash
# Run in Render Shell or locally with production DATABASE_URL
npx prisma migrate deploy
```

## Rollback

If a deployment fails:

1. Go to Deploys tab
2. Find last successful deploy
3. Click "Rollback to this version"

## Support

- Check Render logs first
- Review this deployment guide
- Check application health endpoint
- Contact support with logs and error details
