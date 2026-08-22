# LastMileX - Project Specification

## 1. Executive Summary
LastMileX is an intelligent last-mile delivery management platform designed to streamline logistics operations. The platform offers a comprehensive suite of tools for customer ordering, admin configuration, delivery agent management, dynamic rate calculation, auto-assignment, and immutable order tracking. It provides a robust, scalable, and secure system to manage the end-to-end lifecycle of a delivery, ensuring transparency and efficiency for all stakeholders.

## 2. Technology Stack
- **Frontend**: Next.js 14+, TypeScript (strict), App Router
- **Backend**: Next.js Route Handlers, modular service-layer architecture
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Auth**: Supabase Auth with custom RBAC (CUSTOMER, DELIVERY_AGENT, ADMIN)
- **Validation**: Zod
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Deployment**: Vercel (app), Supabase (database)

## 3. User Roles & Permissions
The system enforces strict Role-Based Access Control (RBAC) with the following roles and permissions:

### CUSTOMER
- Register and login to their account.
- Create orders (receive quote and confirm).
- View only their own orders.
- Track delivery status via an immutable timeline.
- Receive notifications regarding order updates.
- Reschedule failed deliveries.

### DELIVERY_AGENT
- View only assigned orders.
- Update permitted order statuses (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`).
- Update current location status.
- Restricted from accessing or modifying unrelated orders.

### ADMIN
- Full CRUD operations on zones, service areas, rate cards, and COD rules.
- Configure B2B/B2C pricing structures and intra/inter-zone rates.
- View and filter all orders across the system.
- Manually assign delivery agents to orders.
- Trigger the auto-assignment workflow.
- Override order status (with mandatory audit trail logging).
- Create orders on behalf of customers.

## 4. Rate Calculation Engine
The rate calculation engine determines the cost of delivery dynamically based on several parameters.
- **Inputs**: Pickup address, drop address, package dimensions (L×B×H), actual weight, order type (B2B/B2C), and payment type (PREPAID/COD).
- **Volumetric Weight**: Calculated as (L × B × H) ÷ 5000.
- **Chargeable Weight**: The maximum value between actual weight and volumetric weight (MAX(actual, volumetric)).
- **Zone Detection**: Determines the pickup zone and drop zone based on service areas.
- **Route Type**: Classifies the route as either intra-zone (same pickup/drop zone) or inter-zone (different zones).
- **Rate Card Lookup**: Matches pricing using a combination of B2B/B2C flag, route type, and chargeable weight slab.
- **COD Surcharge**: Applied dynamically when `payment_type = COD`.
- **Structure**: Rate cards utilize weight slabs consisting of a base price plus a per-kg rate for exceeding weight.
- **Historical Accuracy**: A pricing snapshot is preserved within the order record at creation to maintain accuracy despite future rate changes.
- **Future Pricing**: Any changes to rate cards will ONLY affect future orders, maintaining integrity for existing orders.

## 5. Zone Detection
- **Mechanism**: Utilizes a PIN code → ServiceArea → Zone mapping approach.
- **Configuration**: Admins create Zones and define associated ServiceAreas using PIN codes or locality names.
- **Resolution**: Address inputs provide the PIN code used for zone resolution.
- **Fallback**: Provides manual zone selection or rejects the order if it falls within unsupported areas.
- **Future Expansion**: Planned support for geospatial coordinates for more precise mapping.

## 6. Order Lifecycle
The order lifecycle is managed through a strict state machine with the following states:
- `CREATED` → `CONFIRMED` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`
- `FAILED` (transition from `OUT_FOR_DELIVERY`)
- `CANCELLED` (transition from `CREATED` or `CONFIRMED`)
- `RESCHEDULED` (transition from `FAILED`)

Transitions are restricted by role. For example, agents can transition from `ASSIGNED` to `DELIVERED` or `FAILED`, while customers can only cancel prior to assignment. Every transition triggers specific side effects (e.g., tracking events, notifications).

## 7. Auto-Assignment Logic
- **Agent Availability States**: `AVAILABLE`, `BUSY`, `OFFLINE`.
- **Candidate Filtering**: Filters agents based on zone match, current availability, and active workload.
- **Scoring System**: Ranks agents using a zone-match bonus, inverse workload score, and a proximity bonus (if location data is known).
- **Tie-breaking**: Uses deterministic tie-breaking based on agent ID.
- **Concurrency Control**: Implements optimistic locking or `SELECT FOR UPDATE` to prevent race conditions during assignment.
- **Fallback**: If no suitable agent is found, the order remains `CONFIRMED`, and the admin is notified for manual intervention.
- **Reassignment**: Orders that are `FAILED` or `RESCHEDULED` re-enter the assignment pool for reassignment.

## 8. Immutable Tracking History
- Every change in order status appends a new `OrderTrackingEvent`.
- **Fields**: `id`, `orderId`, `previousStatus`, `newStatus`, `timestamp`, `actorId`, `actorRole`, `note`, `metadata`.
- **Immutability**: `UPDATE` and `DELETE` operations are strictly prohibited on tracking events.
- **Enforcement**: Database constraints and application logic enforce the append-only nature of tracking history.

## 9. Failed Delivery & Rescheduling
- **Failure Handling**: A failed delivery triggers a tracking event, a notification, and captures the specific failure reason.
- **Rescheduling**: Customers can select a new delivery date (capped at a maximum of 3 attempts).
- **Delivery Attempts**: Records (`DeliveryAttempt`) are maintained to preserve the history of attempts.
- **Re-entry**: A new attempt causes the order to re-enter the assignment pool.
- **Idempotency**: Attempt status checks ensure idempotency in the rescheduling process.

## 10. Notifications
- **Architecture**: Utilizes an abstracted `NotificationService` supporting `EmailProvider` and `SmsProvider` interfaces.
- **Trigger Events**: Confirmation, assignment, picked up, in transit, out for delivery, delivered, failed, rescheduled.
- **MVP Integrations**: Resend (for email) and Twilio (for SMS).
- **Reliability**: Notification delivery failures do NOT cause a rollback of the order state.
- **Audit**: Notification records are stored in the database for auditing and retry mechanisms.

## 11. Security & RBAC
- **Authentication**: Managed via Supabase Auth.
- **Authorization**: Custom middleware ensures role-based authorization for all routes.
- **Data Ownership**: Server-side checks are enforced on every request to ensure users only access their permitted data.
- **Data Access**: Prisma is used exclusively for all DB access (direct Supabase client usage in the browser for writes is prohibited).
- **Environment**: Strict separation of environment variables (using `.env.local`).
- **Validation**: Zod is used for rigorous input validation on all API endpoints.
- **Protection**: CORS and rate limiting are implemented to secure the API.

## 12. Quality Requirements
- **TypeScript**: Strict mode enabled globally.
- **Validation**: Zod validation enforced for all external inputs.
- **Error Handling**: Centralized error handling and a consistent API response format across all endpoints.
- **Transactions**: Multi-step operations are executed within database transactions.
- **Reliability**: Idempotency is guaranteed for critical operations.
- **Testing**: Comprehensive test suite including unit tests (Vitest) for business logic, integration tests for workflows, and E2E tests (Playwright) for critical user flows.
- **CI/CD**: Passing lint, type checking, and production builds are required for deployment.

## 13. Design Constraints
- No hardcoded zones, rate cards, COD surcharges, or agents.
- No arbitrary status changes; the state machine must be strictly enforced.
- No mutation of the tracking history (append-only).
- No cross-customer or cross-agent data access allowed.
- No privileged DB credentials exposed in the browser environment.
- Core business logic must remain independent from UI components.
- The system must follow a modular monolith architecture.

## 14. Engineering Assumptions
- **A1**: The system operates with a single currency (INR) for the MVP.
- **A2**: Weight measurements are in kilograms (kg), and dimensions are in centimeters (cm).
- **A3**: Zone detection relies on PIN codes for the MVP (geocoding API is not required).
- **A4**: Rate calculation is performed synchronously (no background queue required).
- **A5**: Agent location relies on the last-reported location, not a live GPS stream for the MVP.
- **A6**: A maximum of 3 delivery attempts is permitted per order.
- **A7**: Email serves as the primary notification channel; SMS is considered secondary/optional.
- **A8**: The MVP operates on a single warehouse/hub model (pickup is always from the merchant's address).
- **A9**: COD surcharge is implemented as a configurable flat fee or percentage per zone pair.
- **A10**: Admins possess the authority to override any status transition, provided it is accompanied by an audit log.
- **A11**: All timestamps are recorded and processed in UTC.
- **A12**: Zones, areas, and rate cards utilize soft-delete to preserve referential integrity for historical orders.
- **A13**: Rate card versioning is managed via an `effective_from` date, rather than mutating existing records.
