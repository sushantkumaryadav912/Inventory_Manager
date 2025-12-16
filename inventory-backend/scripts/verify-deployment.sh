#!/bin/bash

# Deployment Verification Script
# Run this before deploying to catch common issues

set -e

echo "🔍 Running deployment verification checks..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from inventory-backend/"
  exit 1
fi

echo "✓ In correct directory"

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Error: Node.js version must be 20 or higher (current: $(node --version))"
  exit 1
fi
echo "✓ Node.js version: $(node --version)"

# Check if .env exists (for local testing)
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found (OK for Render deployment)"
else
  echo "✓ .env file exists"
  
  # Check required environment variables
  if ! grep -q "DATABASE_URL" .env; then
    echo "❌ Error: DATABASE_URL not set in .env"
    exit 1
  fi
  echo "✓ DATABASE_URL is set"
  
  if ! grep -q "NEON_JWKS_URL" .env; then
    echo "❌ Error: NEON_JWKS_URL not set in .env"
    exit 1
  fi
  echo "✓ NEON_JWKS_URL is set"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "⚠️  Installing dependencies..."
  npm install
fi
echo "✓ Dependencies installed"

# Check TypeScript compilation
echo "🔨 Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error: TypeScript compilation failed"
  exit 1
fi
echo "✓ TypeScript compilation successful"

# Check if Prisma schema is valid
echo "🔍 Validating Prisma schema..."
npx prisma validate
if [ $? -ne 0 ]; then
  echo "❌ Error: Prisma schema validation failed"
  exit 1
fi
echo "✓ Prisma schema is valid"

# Check if Prisma Client can be generated
echo "🔨 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Error: Prisma Client generation failed"
  exit 1
fi
echo "✓ Prisma Client generated successfully"

# Check if main.js exists after build
if [ ! -f "dist/src/main.js" ]; then
  echo "❌ Error: dist/src/main.js not found after build"
  exit 1
fi
echo "✓ Built files exist"

# Check for common security issues
echo "🔒 Checking for security issues..."

# Check if .env is in .gitignore
if [ -f ".gitignore" ] && ! grep -q ".env" .gitignore; then
  echo "⚠️  Warning: .env should be in .gitignore"
fi

# Check for hardcoded secrets
if grep -r "password\|secret\|api_key" src/ --include="*.ts" | grep -v "process.env" | grep -v "// " | grep -v "/\*" > /dev/null; then
  echo "⚠️  Warning: Possible hardcoded secrets found in source code"
fi

echo "✓ Basic security checks passed"

echo ""
echo "✅ All verification checks passed!"
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Fix deployment issues'"
echo "2. Push to your repository: git push"
echo "3. Deploy on Render following DEPLOYMENT.md"
echo ""
