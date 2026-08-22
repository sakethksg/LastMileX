# LastMileX — Production Setup & Operational Runbook

## Overview

LastMileX is a deterministic, enterprise-grade last-mile delivery and dispatch management platform built on Next.js App Router, TypeScript, Prisma ORM, and Supabase PostgreSQL.

---

## 1. Prerequisites & Infrastructure

- **Node.js**: >= 20.x LTS
- **Package Manager**: npm (with `package-lock.json`)
- **PostgreSQL Database**: Supabase PostgreSQL 15+ (with support for UUID extensions and Connection Pooling via PgBouncer / Supavisor)
- **Supabase Authentication**: Enabled with Email / Password and JWT claims

---

## 2. Environment Configuration

Copy `.env.example` to your deployment environment variables manager:

```bash
cp .env.example .env.production
```

### Required Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Canonical HTTPS endpoint for Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Anonymous API key used for browser authentication |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Canonical domain for the application (e.g., `https://dispatch.lastmilex.com`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only Secret** | Admin key for backend database bypass and privileged operations |
| `DATABASE_URL` | **Server-Only Secret** | Pooled PostgreSQL URL with `?pgbouncer=true` parameter |
| `DIRECT_URL` | **Server-Only Secret** | Direct PostgreSQL port 5432 connection URL for migrations |
| `NODE_ENV` | Runtime | Must be set to `production` in production environments |

> [!CAUTION]
> NEVER expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `DIRECT_URL` with `NEXT_PUBLIC_` prefixes.

---

## 3. Database Deployment & Migration Workflow

1. **Verify Schema Syntax**:
   ```bash
   npx prisma validate
   ```

2. **Generate Client**:
   ```bash
   npx prisma generate
   ```

3. **Deploy Schema Migrations to Production DB**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify Seed Data (Zones, Surcharges, Rate Cards)**:
   Ensure initial zones, service areas, rate cards, and weight slabs are provisioned before accepting customer shipment orders.

---

## 4. Build & Start Commands

- **Production Compilation**:
  ```bash
  npm run build
  ```

- **Production Web Server**:
  ```bash
  npm run start
  ```

---

## 5. Security & RBAC Invariants

1. **Server-Authoritative Enforcement**:
   - Client-side `RoleGuard` provides UX navigation assistance.
   - All server API routes enforce strict RBAC and tenant IDOR checks via `getCurrentUser()` and `authorizeRoles(...)`.
2. **Immutable Pricing Snapshots**:
   - Order charges are strictly calculated on the server and written to `pricing_snapshots` at creation. Client-submitted prices are ignored.
3. **Finite State Machine Invariants**:
   - Orders strictly transition along the state machine (`CONFIRMED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `FAILED`). Jumps are rejected with `409 CONFLICT`.

---

## 6. Pre-Deployment Verification Checklist

- [ ] All environment variables configured in hosting environment
- [ ] Database connection pooling enabled (`pgbouncer=true` on port 6543)
- [ ] Direct database migration connection active on port 5432
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 warnings/errors
- [ ] `npm run test` completes with 100% passing test suites
- [ ] `npm run build` generates 0 runtime bundling errors
- [ ] Auth redirect URLs configured in Supabase dashboard for production domain
