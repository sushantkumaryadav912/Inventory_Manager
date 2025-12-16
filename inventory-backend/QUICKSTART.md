# Quick Start Guide

Get your Inventory Backend running on Render in 10 minutes.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com)
- PostgreSQL database credentials (or create on Render)
- Neon Auth JWKS URL

## Step 1: Prepare Your Repository (2 minutes)

1. Ensure all code is committed:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push
   ```

2. Verify deployment readiness (optional but recommended):
   ```bash
   cd inventory-backend
   ./scripts/verify-deployment.sh
   ```

## Step 2: Create Database on Render (3 minutes)

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `inventory-db`
   - **Database:** `inventory`
   - **User:** `inventory_user`
   - **Region:** Choose closest to your users
   - **Plan:** Free (or paid for production)
4. Click **"Create Database"**
5. **IMPORTANT:** Copy the **Internal Database URL** 
   - Format: `postgresql://user:password@host/database`
   - You'll need this in Step 4

## Step 3: Create Web Service (2 minutes)

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `inventory-backend`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** `inventory-backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free (or paid for production)

## Step 4: Set Environment Variables (3 minutes)

In the Web Service settings, add these environment variables:

### Required Variables

1. **DATABASE_URL**
   ```
   postgresql://user:password@host/database
   ```
   *(Paste the Internal Database URL from Step 2)*

2. **NODE_ENV**
   ```
   production
   ```

3. **NEON_JWKS_URL**
   ```
   https://your-project.neon.tech/.well-known/jwks.json
   ```
   *(Your Neon Auth JWKS endpoint)*

### Optional Variables (Can Set Later)

4. **ALLOWED_ORIGINS** (Optional - for production security)
   ```
   https://yourdomain.com,https://www.yourdomain.com
   ```
   *(Your frontend URLs - include protocol, no trailing slash)*
   
   **Note:** If not set, the backend will accept requests from all origins. Set this once your frontend is deployed for better security.

### How to Add Variables

1. Scroll to **"Environment"** section
2. Click **"Add Environment Variable"**
3. Enter **Key** and **Value**
4. Click **"Add"**
5. Repeat for all variables

## Step 5: Deploy! (Auto)

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Generate Prisma Client
   - Build TypeScript code
   - Start your application
3. Wait for "Deploy succeeded" message (usually 2-3 minutes)

## Step 6: Verify Deployment (1 minute)

Your app will be available at: `https://your-app-name.onrender.com`

### Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "uptime": 123.456
}
```

### Test Root Endpoint
```bash
curl https://your-app-name.onrender.com/
```

**Expected Response:**
```json
{
  "name": "Inventory Backend API",
  "version": "1.0.0",
  "status": "running",
  "environment": "production"
}
```

## ✅ Done!

Your backend is now live and ready to handle requests!

---

## Next Steps

### Connect Your Frontend

Update your frontend's API URL to:
```
https://your-app-name.onrender.com
```

### Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Configure DNS as instructed
4. Update `ALLOWED_ORIGINS` to include your custom domain

### Enable Automatic Deploys

Automatic deploys are enabled by default. Every push to your main branch will trigger a new deployment.

To disable:
1. Go to **Settings**
2. Scroll to **Auto-Deploy**
3. Toggle off

---

## Troubleshooting

### Build Failed

**Check Build Logs:**
1. Go to **"Logs"** tab
2. Look for error messages
3. Common issues:
   - Missing `DATABASE_URL` → Add in environment variables
   - Prisma generation failed → Check `DATABASE_URL` format
   - TypeScript errors → Fix in code and push

### Deploy Succeeded but Health Check Fails

**Check Runtime Logs:**
1. Go to **"Logs"** tab  
2. Look for runtime errors
3. Common issues:
   - Database connection failed → Verify `DATABASE_URL`
   - `NEON_JWKS_URL` not set → Add in environment variables
   - Missing environment variables → Double-check all required vars

### CORS Errors from Frontend

1. Verify `ALLOWED_ORIGINS` is set correctly
2. Include protocol (`https://`)
3. No trailing slashes
4. Comma-separated for multiple domains
5. Example: `https://app.example.com,https://www.example.com`

### Authentication Not Working

1. Verify `NEON_JWKS_URL` is correct
2. Test JWKS endpoint in browser
3. Check JWT token format
4. Ensure `Authorization: Bearer <token>` header is sent

---

## Need More Help?

- 📖 [Full Deployment Guide](DEPLOYMENT.md)
- 🔒 [Security Guidelines](SECURITY.md)
- 🐛 [Fixes Applied](FIXES.md)
- 📝 [Main README](../README.md)

---

## Support

If you're still having issues:

1. Check Render logs thoroughly
2. Verify all environment variables
3. Test database connectivity
4. Review [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
5. Check [SECURITY.md](SECURITY.md) for configuration issues

---

**Estimated Total Time:** ~10 minutes

**Last Updated:** January 2025
