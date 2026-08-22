# Architecture - LastMileX

## Overview
LastMileX is a production-quality last-mile delivery management platform built as a modular monolith using Next.js. The architecture emphasizes clean separation of concerns, testability, and independence from infrastructure-specific implementations.

## High-Level Architecture

Create a Mermaid architecture diagram showing:
- Client (Browser) → Next.js App (Vercel)
- Next.js App contains: App Router Pages, Route Handlers (API), Middleware (Auth/RBAC), Service Layer, Data Access Layer (Prisma)
- Service Layer contains: RateEngine, OrderService, AssignmentService, NotificationService, ZoneService, TrackingService
- Data Access Layer → Supabase PostgreSQL
- External: Supabase Auth, Resend (Email), Twilio (SMS)

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js App Router Pages"]
    end
    
    subgraph Vercel["Next.js Application (Vercel)"]
        subgraph Presentation["Presentation Layer"]
            Pages["App Router Pages (SSR/CSR)"]
            API["Route Handlers (/api/*)"]
            MW["Middleware (Auth + RBAC)"]
        end
        
        subgraph Services["Service Layer"]
            RateEngine["RateEngineService"]
            OrderSvc["OrderService"]
            AssignSvc["AssignmentService"]
            NotifSvc["NotificationService"]
            ZoneSvc["ZoneService"]
            TrackSvc["TrackingService"]
            UserSvc["UserService"]
            AgentSvc["AgentService"]
        end
        
        subgraph Data["Data Access Layer"]
            Prisma["Prisma Client"]
            Repos["Repository Pattern"]
        end
    end
    
    subgraph External["External Services"]
        SupaAuth["Supabase Auth"]
        SupaDB[("Supabase PostgreSQL")]
        Resend["Resend (Email)"]
        Twilio["Twilio (SMS)"]
    end
    
    Client --> Vercel
    Pages --> API
    API --> MW
    MW --> Services
    Services --> Data
    Prisma --> SupaDB
    MW --> SupaAuth
    NotifSvc --> Resend
    NotifSvc --> Twilio
```

## Module Boundaries

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (customer)/               # Customer dashboard pages
│   ├── (admin)/                  # Admin dashboard pages
│   ├── (agent)/                  # Agent dashboard pages
│   ├── api/                      # Route Handlers
│   │   ├── auth/                 # Auth endpoints
│   │   ├── admin/                # Admin endpoints
│   │   ├── customer/             # Customer endpoints
│   │   └── agent/                # Agent endpoints
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Shared React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared business components
├── lib/                          # Core library code
│   ├── prisma.ts                 # Prisma client singleton
│   ├── supabase/                 # Supabase client config
│   │   ├── server.ts             # Server-side client
│   │   └── client.ts             # Client-side client (auth only)
│   ├── auth/                     # Auth utilities
│   │   ├── middleware.ts         # Auth middleware
│   │   ├── rbac.ts               # Role-based access control
│   │   └── session.ts            # Session management
│   └── utils/                    # General utilities
├── services/                     # Business logic services
│   ├── rate-engine/              # Rate calculation engine
│   │   ├── rate-engine.service.ts
│   │   ├── zone-resolver.ts
│   │   ├── weight-calculator.ts
│   │   └── types.ts
│   ├── order/                    # Order management
│   │   ├── order.service.ts
│   │   ├── state-machine.ts
│   │   └── types.ts
│   ├── assignment/               # Agent assignment
│   │   ├── assignment.service.ts
│   │   ├── scoring.ts
│   │   └── types.ts
│   ├── tracking/                 # Tracking events
│   │   ├── tracking.service.ts
│   │   └── types.ts
│   ├── notification/             # Notifications
│   │   ├── notification.service.ts
│   │   ├── providers/
│   │   │   ├── email.provider.ts
│   │   │   ├── sms.provider.ts
│   │   │   └── provider.interface.ts
│   │   ├── templates/
│   │   └── types.ts
│   ├── zone/                     # Zone management
│   │   ├── zone.service.ts
│   │   └── types.ts
│   ├── user/                     # User management
│   │   ├── user.service.ts
│   │   └── types.ts
│   └── agent/                    # Agent management
│       ├── agent.service.ts
│       └── types.ts
├── repositories/                 # Data access repositories
│   ├── order.repository.ts
│   ├── zone.repository.ts
│   ├── rate-card.repository.ts
│   ├── agent.repository.ts
│   ├── tracking.repository.ts
│   ├── notification.repository.ts
│   └── user.repository.ts
├── schemas/                      # Zod validation schemas
│   ├── auth.schema.ts
│   ├── order.schema.ts
│   ├── zone.schema.ts
│   ├── rate-card.schema.ts
│   ├── agent.schema.ts
│   └── common.schema.ts
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API request/response types
│   ├── domain.ts                 # Domain model types
│   └── enums.ts                  # Shared enums
└── config/                       # Configuration
    ├── constants.ts
    └── env.ts                    # Environment variable validation

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── unit/
│   ├── services/
│   │   ├── rate-engine/
│   │   ├── order/
│   │   ├── assignment/
│   │   └── tracking/
│   └── schemas/
├── integration/
│   ├── api/
│   └── services/
└── e2e/
    ├── auth.spec.ts
    ├── order-flow.spec.ts
    └── admin-management.spec.ts
```

## Data Flow

### Order Creation Flow
```mermaid
sequenceDiagram
    actor Customer
    participant UI as Next.js Page
    participant API as Route Handler
    participant MW as Auth Middleware
    participant OS as OrderService
    participant RE as RateEngine
    participant ZR as ZoneResolver
    participant DB as Prisma/PostgreSQL
    participant NS as NotificationService
    
    Customer->>UI: Fill order form
    UI->>API: POST /api/customer/quotes
    API->>MW: Validate auth + role
    MW->>RE: calculateQuote(input)
    RE->>ZR: resolveZone(pickupPin)
    ZR->>DB: Query ServiceArea
    ZR-->>RE: pickupZone
    RE->>ZR: resolveZone(dropPin)
    ZR-->>RE: dropZone
    RE->>DB: Query RateCard
    RE->>DB: Query WeightSlab
    RE->>DB: Query CodSurcharge
    RE-->>API: PricingBreakdown
    API-->>UI: Quote displayed
    
    Customer->>UI: Confirm order
    UI->>API: POST /api/customer/orders
    API->>MW: Validate auth + role
    MW->>OS: createOrder(data)
    OS->>RE: calculateQuote(input)
    OS->>DB: BEGIN TRANSACTION
    OS->>DB: Insert Order
    OS->>DB: Insert OrderPricingSnapshot
    OS->>DB: Insert TrackingEvent
    OS->>DB: COMMIT
    OS->>NS: notify(ORDER_CREATED)
    OS-->>API: order
    API-->>UI: Order created
```

## Authentication & RBAC Strategy

### Authentication Flow
1. **Registration**: User signs up via Supabase Auth → Supabase creates auth.users record → webhook/trigger creates application User record in public schema → CustomerProfile created
2. **Login**: Supabase Auth handles credential verification → returns JWT → JWT contains user ID and custom claims
3. **Session**: JWT stored in HTTP-only cookie → sent with every request → middleware validates

### RBAC Implementation
```
Middleware Pipeline:
  1. Extract JWT from Authorization header or cookie
  2. Validate JWT with Supabase (supabase.auth.getUser())
  3. Look up User record in application DB (includes role)
  4. Attach user context to request
  5. Route-level role check:
     - /api/admin/* → requires role = ADMIN
     - /api/customer/* → requires role = CUSTOMER
     - /api/agent/* → requires role = DELIVERY_AGENT
  6. Resource-level ownership check:
     - Customer endpoints: verify order.customerId = currentUser.id
     - Agent endpoints: verify assignment.agentId = currentUser.id
```

### Security Layers
1. **Transport**: HTTPS (Vercel default)
2. **Authentication**: Supabase JWT validation
3. **Authorization**: Role-based middleware + ownership checks
4. **Input Validation**: Zod schemas on every endpoint
5. **Data Access**: Prisma parameterized queries (SQL injection prevention)
6. **Secrets**: Environment variables only (.env.local), never in client code
7. **CORS**: Configured for production domain only
8. **Rate Limiting**: Per-endpoint limits

### Supabase + Prisma Integration
- **Supabase Auth**: Handles user authentication, JWT issuance, email verification
- **Prisma**: All application data access goes through Prisma
- **User sync**: On registration, Supabase Auth creates auth record, application creates User record with same ID
- **No Supabase client for data queries in browser**: All data flows through Next.js API routes → Prisma
- **Supabase client in browser**: ONLY for auth operations (login, logout, session refresh)
- **Server-side Supabase admin client**: For user management operations (creating agents/admins)
- **Database URL**: Supabase direct connection string used by Prisma

## Deployment Architecture

```mermaid
flowchart LR
    subgraph Vercel["Vercel"]
        App["Next.js App"]
        Edge["Edge Middleware"]
        Serverless["Serverless Functions"]
    end
    
    subgraph Supabase["Supabase"]
        Auth["Auth Service"]
        DB[("PostgreSQL")]
    end
    
    subgraph Providers["Notification Providers"]
        Resend["Resend"]
        Twilio["Twilio"]
    end
    
    CDN["Vercel CDN"] --> App
    App --> Edge
    Edge --> Serverless
    Serverless --> Auth
    Serverless --> DB
    Serverless --> Resend
    Serverless --> Twilio
```

### Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-only, never in browser
DATABASE_URL=                       # Prisma connection string
DIRECT_URL=                         # Prisma direct connection (for migrations)

# Auth
NEXTAUTH_SECRET=                    # If using NextAuth adapter
JWT_SECRET=

# Notifications
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

## Key Architectural Decisions

### 1. Modular Monolith over Microservices
**Decision**: Single Next.js application with clear service boundaries
**Rationale**: Reduces deployment complexity, eliminates inter-service communication overhead, appropriate for project scope. Service modules are structured so they COULD be extracted later.

### 2. Service Layer Pattern
**Decision**: All business logic in `/services/`, route handlers are thin orchestrators
**Rationale**: Enables unit testing without HTTP framework, keeps business rules centralized, prevents logic drift into UI components.

### 3. Repository Pattern for Data Access
**Decision**: Thin repository layer between services and Prisma
**Rationale**: Abstracts Prisma-specific queries, enables mocking in unit tests, provides consistent data access patterns.

### 4. Supabase Auth + Prisma Data Access
**Decision**: Use Supabase for auth only, Prisma for all data access
**Rationale**: Supabase Auth provides robust auth without custom implementation. Prisma provides type-safe, migration-friendly data access. Keeping data access through Prisma ensures framework independence.

### 5. PIN Code Based Zone Detection
**Decision**: PIN code → ServiceArea → Zone mapping for MVP
**Rationale**: Simple, reliable, no external API dependency. Suitable for Indian logistics where PIN codes are well-defined. Future: geocoding can supplement.

### 6. Optimistic Locking + SELECT FOR UPDATE
**Decision**: Combine optimistic locking (status checks in WHERE clause) with pessimistic locking (FOR UPDATE) for critical operations
**Rationale**: Optimistic handles most cases cheaply. Pessimistic prevents assignment race conditions.

### 7. shadcn/ui + Tailwind CSS
**Decision**: Component library for consistent UI
**Rationale**: Accessible, customizable, excellent TypeScript support, no external CSS-in-JS runtime. Professional dashboard appearance.

### 8. Immutable Event Sourcing (Partial)
**Decision**: Tracking events are append-only; order table stores current state
**Rationale**: Full event sourcing is overengineering. Hybrid approach gives immutable audit trail plus efficient queries on current state.

### 9. Rate Card Versioning via effectiveFrom
**Decision**: Never mutate rate cards; create new versions with effectiveFrom date
**Rationale**: Preserves historical pricing integrity. Pricing snapshots on orders reference specific rate card versions.

### 10. Notification Outbox Pattern (Simplified)
**Decision**: Store notification records, process inline with retry on failure
**Rationale**: Full outbox pattern with background workers is overengineering for MVP. Inline send with status tracking and retry logic provides adequate reliability.
