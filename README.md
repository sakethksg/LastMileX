# LastMileX

> **Production-Grade Last-Mile Delivery Logistics Backend & API**

LastMileX is an enterprise-grade last-mile logistics and dispatch management platform built with Next.js 15 (App Router), TypeScript (Strict Mode), Prisma ORM, and Supabase PostgreSQL. It provides deterministic rate calculation, transactional order creation with immutable pricing snapshots, intelligent delivery agent assignment, strict state-machine delivery execution, automated failure handling with monotonic retry rescheduling, idempotent event-driven notifications, and real-time operational dashboards for Customers, Agents, and Administrators.

---

## 🚀 Key Features & Domains

### 1. Zone & Serviceability Management (Phase 2)
- Multi-tier zone hierarchy (`Zone`, `ServiceArea`, `Hub`).
- PIN-code-to-zone routing resolution and serviceable area boundaries.
- Admin-managed weight slabs and configurable Cash-on-Delivery (COD) surcharge rules.

### 2. Deterministic Rate Calculation Engine (Phase 3)
- Real-time quote generation (`POST /api/quotes`).
- Volumetric weight vs actual weight comparison ($\text{chargeableWeight} = \max(\text{actualWeight}, \frac{L \times B \times H}{5000})$).
- Slab-based pricing resolution with custom rate cards and COD surcharge fee calculation.

### 3. Transactional Order Management & Pricing Snapshots (Phase 4)
- Transactional order creation with formatted unique tracking identifiers (`LMX-YYYYMMDD-XXXXXX`).
- Immutable `OrderPricingSnapshot` ensuring historical financial charges remain isolated from future rate card modifications.
- Complete audit-trailed `OrderTrackingEvent` transition logging.

### 4. Agent Workload & Deterministic Assignment Engine (Phase 5)
- Delivery agent profiles, shift management, and dynamic capacity tracking ($0 \le \text{activeDeliveryCount} \le \text{maxConcurrentOrders}$).
- Multi-factor deterministic auto-assignment algorithm (40% Zone Affinity, 30% Workload Capacity, 20% Proximity, 10% Recency).
- Admin manual assignment and safe reassignment workflows.

### 5. Delivery Execution, Failure Handling & Rescheduling (Phase 6)
- Finite state-machine delivery execution: `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `FAILED`.
- Structured failure reason recording (e.g. `CUSTOMER_UNAVAILABLE`, `INCORRECT_ADDRESS`, `CUSTOMER_REJECTED`).
- Customer and Admin delivery rescheduling with strictly monotonic retry attempt tracking ($\text{attemptNumber} = n + 1$).
- Safe capacity reclamation upon delivery completion or failure.

### 6. Event-Driven Notifications & Retry Engine (Phase 7)
- Decoupled notification dispatch across 9 lifecycle events (`ORDER_CONFIRMED`, `AGENT_ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `ORDER_RESCHEDULED`, `ORDER_CANCELLED`, etc.).
- Built-in idempotency prevention eliminating duplicate notifications for identical events.
- Admin notification retry endpoint with exponential backoff support.

### 7. Multi-Persona Operational Dashboards (Phase 8)
- **Customer Dashboard** (`GET /api/dashboard/customer`): Active delivery tracking, order history summary, unread notifications.
- **Agent Dashboard** (`GET /api/agent/dashboard`): Real-time active orders, remaining capacity, daily attempt metrics, success rate.
- **Admin Dashboard** (`GET /api/admin/dashboard`): High-level operational metrics, status distributions, agent fleet availability, snapshot-derived revenue totals, recent failure logs.

---

## 🔒 Security & Authorization

- **Server-Side Authentication**: Derived strictly via verified session tokens (`requireAuth()`, `requireRole()`).
- **Role-Based Access Control (RBAC)**: Enforces boundaries across `CUSTOMER`, `DELIVERY_AGENT`, and `ADMIN`.
- **IDOR Protection**: Multi-tenant customer isolation guarantees customers can only access their own orders and notifications. Agents can only interact with orders actively assigned to them.
- **Parameter Tampering Guards**: Server-authoritative resolution for customer types, agent workloads, attempt numbers, and pricing totals.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router, Route Handlers)
- **Language**: TypeScript (Strict Mode, 100% type safety)
- **ORM & Database**: Prisma ORM with Supabase PostgreSQL
- **Validation**: Zod (strict payload validation across all endpoints)
- **Testing**: Vitest (Unit, API, Concurrency, and End-to-End Lifecycle Integration)
- **Architecture**: Modular Monolith following Service-Repository Pattern

---

## 📁 Repository Structure

```text
LastMileX/
├── docs/                      # Architectural & domain design specifications
├── prisma/
│   └── schema.prisma          # PostgreSQL relational schema
├── src/
│   ├── app/api/               # Next.js API route handlers
│   │   ├── admin/             # Admin management & operational routes
│   │   ├── agent/             # Delivery agent routes & actions
│   │   ├── dashboard/         # Customer dashboard route
│   │   ├── notifications/     # Notification routes
│   │   ├── orders/            # Customer order routes & actions
│   │   └── quotes/            # Quote & pricing route
│   ├── lib/                   # Auth, RBAC, state machine, errors, utilities
│   ├── repositories/          # Prisma database repositories
│   ├── schemas/               # Zod validation schemas
│   ├── services/              # Domain business logic layer
│   └── types/                 # Enums and domain interface definitions
└── tests/
    ├── integration/           # Cross-domain end-to-end lifecycle integration tests
    └── unit/                  # Unit, API, RBAC, Security, and Concurrency test suites
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- PostgreSQL database (or Supabase project)

### 2. Installation
```bash
git clone https://github.com/sakethksg/LastMileX.git
cd LastMileX
npm install
```

### 3. Environment Configuration
Create a `.env` or `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL="postgresql://postgres:password@localhost:5432/lastmilex?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/lastmilex?schema=public"
```

### 4. Database Setup & Prisma Generation
```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

### 5. Running the Application
```bash
# Development mode
npm run dev

# Production build & start
npm run build
npm run start
```

---

## 🧪 Testing & Quality Gates

Run the automated test suite and verification commands:
```bash
# Run unit & integration tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build verification
npm run build
```

---

## 📜 License

This project is licensed under the MIT License.
