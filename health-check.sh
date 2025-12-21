#!/bin/bash

# Orbis App - Quick Health Check Script

echo "=================================="
echo "Orbis App Health Check"
echo "=================================="
echo ""

# Check Frontend Setup
echo "📱 FRONTEND CHECKS"
echo "------------------"

if [ -f "/app/Orbis/.env" ]; then
    echo "✅ Frontend .env file exists"
else
    echo "❌ Frontend .env file missing"
fi

if [ -f "/app/Orbis/polyfills/crypto.js" ]; then
    echo "✅ Crypto polyfill exists"
else
    echo "❌ Crypto polyfill missing"
fi

if [ -d "/app/Orbis/node_modules/expo-crypto" ]; then
    echo "✅ expo-crypto package installed"
else
    echo "❌ expo-crypto package not installed"
fi

# Check if polyfill is imported in index.js
if grep -q "import './polyfills/crypto'" /app/Orbis/index.js; then
    echo "✅ Crypto polyfill imported in index.js"
else
    echo "❌ Crypto polyfill not imported in index.js"
fi

echo ""

# Check Backend Setup
echo "🖥️  BACKEND CHECKS"
echo "------------------"

if [ -f "/app/inventory-backend/.env" ]; then
    echo "✅ Backend .env file exists"
else
    echo "❌ Backend .env file missing"
fi

if grep -q "@Get('me')" /app/inventory-backend/src/auth/auth.controller.ts; then
    echo "✅ /auth/me endpoint added"
else
    echo "❌ /auth/me endpoint missing"
fi

if grep -q "@Post('logout')" /app/inventory-backend/src/auth/auth.controller.ts; then
    echo "✅ /auth/logout endpoint added"
else
    echo "❌ /auth/logout endpoint missing"
fi

echo ""
echo "=================================="
echo "Health Check Complete!"
echo "=================================="
echo ""
echo "Next Steps:"
echo "1. Update /app/Orbis/.env with your Neon Auth credentials"
echo "2. Update /app/inventory-backend/.env with your database and JWKS URL"
echo "3. Start backend: cd /app/inventory-backend && npm run start:dev"
echo "4. Start frontend: cd /app/Orbis && npx expo start"
echo ""
