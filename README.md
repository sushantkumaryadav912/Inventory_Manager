
# Inventory Manager

## Backend setup

The NestJS backend lives in `inventory-backend/`.

### Environment variables

Create an env file at `inventory-backend/.env`:

- Copy `inventory-backend/.env.example` → `inventory-backend/.env`
- Fill in at least `DATABASE_URL`

### Run

```bash
cd inventory-backend
npm install
npm run start:dev
```

### Prisma

Prisma commands also require `DATABASE_URL`:

```bash
cd inventory-backend
npx prisma validate
```
