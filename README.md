# LastMileX

> **Production-Grade Last-Mile Delivery Logistics & Dispatch Management Platform**

LastMileX is an enterprise-grade last-mile logistics platform built with Next.js 15 (App Router), TypeScript (Strict Mode), Tailwind CSS, Prisma ORM, and Supabase PostgreSQL. It features deterministic rate calculation, transactional order creation with immutable pricing snapshots, intelligent delivery agent assignment, strict state-machine delivery execution, automated failure handling with monotonic retry rescheduling, idempotent event-driven notifications, and role-based frontend portals for Customers, Delivery Agents, and Operations Administrators.

---

## 🚀 Key Features & Domains

### 1. Zone & Serviceability Management (Phase 2)
- Multi-tier zone hierarchy (`Zone`, `ServiceArea`, `Hub`).
- PIN-code-to-zone routing resolution and serviceable area boundaries.
- Admin-managed weight slabs and configurable Cash-on-Delivery (COD) surcharge rules.

### 2. Deterministic Rate Calculation Engine (Phase 3)
- Real-time volumetric and weight pricing engine (`POST /api/quotes`).
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
- Structured failure reason recording (`CUSTOMER_UNAVAILABLE`, `ADDRESS_NOT_FOUND`, `CUSTOMER_REFUSED`, `ACCESS_RESTRICTED`, `PACKAGE_DAMAGED`, `OTHER`).
- Customer and Admin delivery rescheduling with strictly monotonic retry attempt tracking ($\text{attemptNumber} = n + 1$).
- Safe capacity reclamation upon delivery completion or failure.

### 6. Event-Driven Notifications & Retry Engine (Phase 7)
- Decoupled notification dispatch across lifecycle events (`ORDER_CONFIRMED`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RESCHEDULED`, etc.).
- Built-in idempotency prevention eliminating duplicate notifications for identical events.
- Admin notification retry endpoint with exponential backoff support.

### 7. Multi-Persona Operational Dashboards & Role-Based UI (Phases 8, 12, 13)
- **Customer Portal** (`/dashboard`, `/orders`, `/orders/[id]`, `/orders/new`, `/notifications`): Live tracking, interactive rate estimator, 2-step shipment booking, attempt history, customer rescheduling.
- **Delivery Agent Portal** (`/agent/dashboard`, `/agent/orders`, `/agent/orders/[id]`): Active workload vs capacity telemetry, assigned dispatches, state-driven action bar (Pickup $\rightarrow$ In Transit $\rightarrow$ Out for Delivery $\rightarrow$ Complete / Report Failure).
- **Admin Operations Console** (`/admin/dashboard`, `/admin/orders`, `/admin/orders/[id]`, `/admin/agents`, `/admin/agents/[id]`, `/admin/notifications`): Fleet capacity monitoring, manual driver assignment, one-click auto-assignment, agent profile edits, notification retry log.

---

## 🔒 Security & Authorization Invariants

- **Server-Authoritative RBAC**: Client-side `RoleGuard` provides user guidance; all server API routes enforce strict RBAC boundaries (`requireAuth()`, `authorizeRoles()`).
- **IDOR Protection**: Multi-tenant customer isolation guarantees customers access only their own orders. Delivery agents can interact only with orders assigned to them.
- **State Machine Isolation**: Orders transition strictly along valid directed acyclic paths. Invalid transitions and jumps from terminal states are rejected with `409 CONFLICT`.
- **Secret Isolation**: Service role keys and database URLs are strictly restricted to server execution environments and excluded from client bundles.

---

## 📁 Repository Structure

```text
LastMileX/
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI verification pipeline
├── docs/                      # Architectural & domain design specifications
│   ├── production-setup.md    # Production setup and deployment runbook
│   └── release-readiness.md   # Release checklist & invariants
├── prisma/
│   └── schema.prisma          # PostgreSQL relational schema
├── src/
│   ├── app/                   # Next.js App Router (Pages & API routes)
│   │   ├── (admin)/           # Admin console pages
│   │   ├── (agent)/           # Delivery agent portal pages
│   │   ├── (auth)/            # Login & registration pages
│   │   ├── (customer)/        # Customer portal pages
│   │   └── api/               # Server API route handlers
│   ├── components/            # UI components (PageHeader, Modal, StatusBadge, etc.)
│   ├── context/               # AuthContext & NavContext
│   ├── lib/api/               # Typed frontend API client layer
│   ├── repositories/          # Prisma database repositories
│   ├── schemas/               # Zod validation schemas
│   ├── services/              # Domain business logic layer
│   └── types/                 # Enums and domain interface definitions
└── tests/
    ├── integration/           # Cross-domain end-to-end lifecycle integration tests
    └── unit/                  # Unit, API, RBAC, Security, Concurrency, and UI test suites
```

---

## 🚦 Getting Started

### 1. Installation
```bash
git clone https://github.com/sakethksg/LastMileX.git
cd LastMileX
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Database Setup & Prisma Generation
```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

### 4. Running the Application
```bash
# Development server
npm run dev

# Production build & start
npm run build
npm run start
```

---

## 🧪 Testing & Quality Gates

Run the automated test suite and verification commands:
```bash
# Run 250+ automated unit and integration tests
npm run test

# TypeScript typecheck
npm run typecheck

# ESLint validation
npm run lint

# Production build compilation
npm run build
```

---

## ⚠️ Known Scope Boundaries & Design Limitations

LastMileX is designed around explicit, verified architectural scopes:
- **No WebSockets / Live GPS streaming**: Tracking progress is event-driven via HTTP state transitions and polling telemetry.
- **In-Memory Notification Provider**: Default notifications are delivered through an in-memory mock provider unless external providers (Resend / Twilio) are explicitly configured in production.
- **No External Payment Gateway**: Payments are modeled via `PREPAID` and `COD` transaction records.

---

## 📜 License

This project is licensed under the MIT License.
