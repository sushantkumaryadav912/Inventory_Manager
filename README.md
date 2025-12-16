
# Inventory Manager

A comprehensive inventory management system built with NestJS, Prisma, and PostgreSQL.

## Backend Setup

The NestJS backend lives in `inventory-backend/`.

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- Neon Auth account (for authentication)

### Local Development

1. **Install dependencies:**
   ```bash
   cd inventory-backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEON_JWKS_URL` - Your Neon Auth JWKS endpoint
   - `NODE_ENV` - Set to `development`

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run the development server:**
   ```bash
   npm run start:dev
   ```

   The API will be available at http://localhost:3000

### Prisma Commands

```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Run migrations (if you have them)
npx prisma migrate deploy
```

## Deployment

### Render Deployment

See [DEPLOYMENT.md](inventory-backend/DEPLOYMENT.md) for detailed instructions on deploying to Render.

**Quick Start:**
1. Create PostgreSQL database on Render
2. Create Web Service pointing to this repo
3. Set environment variables (DATABASE_URL, NEON_JWKS_URL, NODE_ENV, ALLOWED_ORIGINS)
4. Deploy automatically builds and starts the service

### Pre-Deployment Verification

Run the verification script before deploying:
```bash
cd inventory-backend
./scripts/verify-deployment.sh
```

## Security

See [SECURITY.md](inventory-backend/SECURITY.md) for security guidelines and best practices.

**Key Security Features:**
- JWT authentication via Neon Auth
- CORS protection with configurable origins
- Helmet security headers
- Input validation with Zod
- SQL injection prevention via Prisma ORM
- Graceful shutdown handling
- Production-ready error handling

## API Endpoints

### Health Check
```bash
GET /health
```
Returns API health status and database connectivity.

### Authentication
All endpoints (except `/health` and `/`) require:
- `Authorization: Bearer <JWT_TOKEN>` header
- `x-shop-id: <SHOP_UUID>` header

### Main Resources
- `/inventory` - Inventory management
- `/purchases` - Purchase orders
- `/sales` - Sales transactions
- `/contacts/customers` - Customer management
- `/contacts/suppliers` - Supplier management
- `/reports` - Business reports

## Architecture

### Tech Stack
- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Neon Auth (JWT with RS256)
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, compression

### Key Features
- Multi-tenant shop system
- Role-based access control (Owner, Manager, Staff)
- Real-time inventory tracking
- Stock movement history
- Purchase and sales management
- Customer and supplier management
- Comprehensive reporting

## Development

### Project Structure
```
inventory-backend/
├── src/
│   ├── auth/          # Authentication & guards
│   ├── common/        # Shared utilities
│   ├── config/        # Configuration
│   ├── contacts/      # Customers & suppliers
│   ├── inventory/     # Inventory management
│   ├── prisma/        # Database service
│   ├── purchases/     # Purchase orders
│   ├── reports/       # Business reports
│   ├── sales/         # Sales transactions
│   └── main.ts        # Application entry point
├── prisma/
│   └── schema.prisma  # Database schema
└── test/              # Tests
```

### Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Lint code
- `npm run test` - Run tests

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database is accessible
- Ensure SSL is configured for production

### Authentication Errors
- Verify NEON_JWKS_URL is correct
- Check JWT token format
- Ensure Authorization header is present

### CORS Errors
- Add your frontend domain to ALLOWED_ORIGINS
- Include protocol (https://)
- No trailing slashes

### Build Failures
- Check Node.js version (must be 20+)
- Run `npm install` to update dependencies
- Verify Prisma schema is valid
- Check for TypeScript errors

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review deployment logs in Render
3. Check application health endpoint
4. Review [SECURITY.md](inventory-backend/SECURITY.md) and [DEPLOYMENT.md](inventory-backend/DEPLOYMENT.md)

## License

UNLICENSED - Private project
