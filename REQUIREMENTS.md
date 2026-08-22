# LastMileX Requirements Traceability Matrix

## Requirements Matrix

| Req ID | Category | Description | Priority | Module | DB Support | API Support | Test Coverage | Status |
|--------|----------|-------------|----------|--------|------------|-------------|---------------|--------|
| AUTH-01 | AUTH | User registration (email/password) | HIGH | auth | User table | POST /api/auth/register | Unit + E2E | PLANNED |
| AUTH-02 | AUTH | User login | HIGH | auth | User table | POST /api/auth/login | Unit + E2E | PLANNED |
| AUTH-03 | AUTH | Role-based access control (CUSTOMER, DELIVERY_AGENT, ADMIN) | HIGH | auth/middleware | User.role | All endpoints | Unit + Integration | PLANNED |
| AUTH-04 | AUTH | Server-side authorization enforcement | HIGH | middleware | - | All endpoints | Integration | PLANNED |
| AUTH-05 | AUTH | Ownership verification (customers see own orders only) | HIGH | middleware | Order.customerId | GET /api/customer/orders | Integration | PLANNED |
| AUTH-06 | AUTH | Session management | HIGH | auth | - | - | Integration | PLANNED |
| ZONE-01 | ZONE | Create/update/delete zones | HIGH | admin/zones | Zone table | CRUD /api/admin/zones | Unit | PLANNED |
| ZONE-02 | ZONE | Create/update/delete service areas | HIGH | admin/areas | ServiceArea table | CRUD /api/admin/service-areas | Unit | PLANNED |
| ZONE-03 | ZONE | Associate areas with zones | HIGH | admin/areas | ServiceArea.zoneId | PUT /api/admin/service-areas/:id | Unit | PLANNED |
| ZONE-04 | ZONE | PIN code to zone resolution | HIGH | zones/service | ServiceArea.pinCodes | Internal service | Unit + Edge cases | PLANNED |
| ZONE-05 | ZONE | Unsupported zone/area handling | MEDIUM | zones/service | - | Quote endpoint | Unit | PLANNED |
| RATE-01 | RATE | Volumetric weight calculation (L×B×H÷5000) | HIGH | rate-engine | - | Internal | Unit | PLANNED |
| RATE-02 | RATE | Chargeable weight (MAX actual, volumetric) | HIGH | rate-engine | - | Internal | Unit | PLANNED |
| RATE-03 | RATE | B2B/B2C rate card configuration | HIGH | admin/rates | RateCard table | CRUD /api/admin/rate-cards | Unit | PLANNED |
| RATE-04 | RATE | Intra-zone vs inter-zone rate lookup | HIGH | rate-engine | RateCard | Internal | Unit | PLANNED |
| RATE-05 | RATE | Weight slab based pricing | HIGH | rate-engine | WeightSlab table | Internal | Unit + Edge cases | PLANNED |
| RATE-06 | RATE | COD surcharge configuration | HIGH | admin/rates | CodSurcharge table | CRUD /api/admin/cod-surcharges | Unit | PLANNED |
| RATE-07 | RATE | COD surcharge application | HIGH | rate-engine | CodSurcharge | Internal | Unit | PLANNED |
| RATE-08 | RATE | Quote calculation before order confirmation | HIGH | rate-engine | - | POST /api/customer/quotes | Unit + Integration | PLANNED |
| RATE-09 | RATE | Pricing snapshot at order creation | HIGH | orders | OrderPricingSnapshot | Internal | Unit | PLANNED |
| RATE-10 | RATE | Rate card versioning (effective_from) | MEDIUM | admin/rates | RateCard.effectiveFrom | Internal | Unit | PLANNED |
| RATE-11 | RATE | Complete pricing breakdown in response | HIGH | rate-engine | - | POST /api/customer/quotes | Unit | PLANNED |
| ORDER-01 | ORDER | Create order (customer) | HIGH | orders | Order table | POST /api/customer/orders | Unit + Integration | PLANNED |
| ORDER-02 | ORDER | Create order on behalf of customer (admin) | MEDIUM | orders | Order table | POST /api/admin/orders | Unit | PLANNED |
| ORDER-03 | ORDER | View own orders (customer) | HIGH | orders | Order | GET /api/customer/orders | Integration | PLANNED |
| ORDER-04 | ORDER | View all orders with filters (admin) | HIGH | orders | Order | GET /api/admin/orders | Integration | PLANNED |
| ORDER-05 | ORDER | Order details with tracking timeline | HIGH | orders | Order + TrackingEvent | GET /api/customer/orders/:id | Integration | PLANNED |
| ORDER-06 | ORDER | Order confirmation flow (quote → confirm) | HIGH | orders | Order.status | PUT /api/customer/orders/:id/confirm | Unit + Integration | PLANNED |
| ORDER-07 | ORDER | Order cancellation | MEDIUM | orders | Order.status | PUT /api/customer/orders/:id/cancel | Unit | PLANNED |
| LIFE-01 | LIFECYCLE | State machine enforcement | HIGH | orders/state-machine | Order.status | All status endpoints | Unit + Edge cases | PLANNED |
| LIFE-02 | LIFECYCLE | Allowed transitions validation | HIGH | orders/state-machine | - | Internal | Unit | PLANNED |
| LIFE-03 | LIFECYCLE | Role-based transition permissions | HIGH | orders/state-machine | - | Internal | Unit | PLANNED |
| LIFE-04 | LIFECYCLE | Admin status override with audit | MEDIUM | orders | TrackingEvent | PUT /api/admin/orders/:id/status | Unit | PLANNED |
| LIFE-05 | LIFECYCLE | Side effects on transitions (notifications, etc.) | HIGH | orders | - | Internal | Integration | PLANNED |
| TRACK-01 | TRACK | Tracking event creation on every status change | HIGH | tracking | OrderTrackingEvent | Internal | Unit | PLANNED |
| TRACK-02 | TRACK | Append-only tracking history | HIGH | tracking | DB constraints | Internal | Integration | PLANNED |
| TRACK-03 | TRACK | Tracking timeline display | HIGH | tracking | OrderTrackingEvent | GET /api/customer/orders/:id/tracking | Unit | PLANNED |
| TRACK-04 | TRACK | Actor and role recording | HIGH | tracking | TrackingEvent fields | Internal | Unit | PLANNED |
| ASSIGN-01 | ASSIGN | Manual agent assignment (admin) | HIGH | assignment | AgentAssignment | PUT /api/admin/orders/:id/assign | Unit | PLANNED |
| ASSIGN-02 | ASSIGN | Auto-assignment algorithm | HIGH | assignment | AgentAssignment | POST /api/admin/orders/:id/auto-assign | Unit + Integration | PLANNED |
| ASSIGN-03 | ASSIGN | Agent availability management | HIGH | agents | AgentProfile.availability | PUT /api/agent/availability | Unit | PLANNED |
| ASSIGN-04 | ASSIGN | Zone-based agent filtering | HIGH | assignment | AgentProfile.zoneId | Internal | Unit | PLANNED |
| ASSIGN-05 | ASSIGN | Workload-based scoring | MEDIUM | assignment | Active assignments count | Internal | Unit | PLANNED |
| ASSIGN-06 | ASSIGN | Proximity-based scoring | LOW | assignment | AgentLocation | Internal | Unit | PLANNED |
| ASSIGN-07 | ASSIGN | Concurrent assignment prevention | HIGH | assignment | DB locking | Internal | Integration | PLANNED |
| ASSIGN-08 | ASSIGN | No suitable agent handling | MEDIUM | assignment | - | Internal | Unit | PLANNED |
| ASSIGN-09 | ASSIGN | Reassignment after failure | HIGH | assignment | AgentAssignment | Internal | Unit | PLANNED |
| FAIL-01 | FAIL | Mark order as FAILED | HIGH | orders | Order.status | PUT /api/agent/orders/:id/status | Unit | PLANNED |
| FAIL-02 | FAIL | Failure reason capture | HIGH | orders | TrackingEvent.note | PUT /api/agent/orders/:id/status | Unit | PLANNED |
| FAIL-03 | FAIL | Customer notification on failure | HIGH | notifications | Notification | Internal | Integration | PLANNED |
| FAIL-04 | FAIL | Rescheduling with new date | HIGH | orders | DeliveryAttempt | POST /api/customer/orders/:id/reschedule | Unit + Integration | PLANNED |
| FAIL-05 | FAIL | Delivery attempt tracking | HIGH | orders | DeliveryAttempt | Internal | Unit | PLANNED |
| FAIL-06 | FAIL | Maximum attempt enforcement (3) | MEDIUM | orders | DeliveryAttempt count | Internal | Unit | PLANNED |
| FAIL-07 | FAIL | Agent reassignment on reschedule | HIGH | assignment | AgentAssignment | Internal | Integration | PLANNED |
| FAIL-08 | FAIL | Idempotent reschedule requests | MEDIUM | orders | DeliveryAttempt.status | Internal | Unit | PLANNED |
| NOTIFY-01 | NOTIFY | Notification service abstraction | HIGH | notifications | - | Internal | Unit | PLANNED |
| NOTIFY-02 | NOTIFY | Email provider (Resend) | HIGH | notifications | Notification | Internal | Integration | PLANNED |
| NOTIFY-03 | NOTIFY | SMS provider (Twilio) | LOW | notifications | Notification | Internal | Integration | PLANNED |
| NOTIFY-04 | NOTIFY | Order lifecycle event notifications | HIGH | notifications | Notification | Internal | Integration | PLANNED |
| NOTIFY-05 | NOTIFY | Notification failure isolation | HIGH | notifications | Notification.status | Internal | Unit | PLANNED |
| NOTIFY-06 | NOTIFY | Notification history/audit | MEDIUM | notifications | Notification table | GET /api/admin/notifications | Unit | PLANNED |
| AGENT-01 | AGENT | Agent profile management | HIGH | agents | DeliveryAgentProfile | CRUD /api/admin/agents | Unit | PLANNED |
| AGENT-02 | AGENT | Agent location update | MEDIUM | agents | AgentLocation | PUT /api/agent/location | Unit | PLANNED |
| AGENT-03 | AGENT | View assigned orders (agent) | HIGH | agents | Order + Assignment | GET /api/agent/orders | Integration | PLANNED |
| AGENT-04 | AGENT | Agent status updates | HIGH | agents | DeliveryAgentProfile | PUT /api/agent/availability | Unit | PLANNED |
| UI-01 | UI | Customer registration/login | HIGH | pages/auth | - | - | E2E | PLANNED |
| UI-02 | UI | Customer dashboard (orders list) | HIGH | pages/customer | - | - | E2E | PLANNED |
| UI-03 | UI | Order creation wizard (quote → confirm) | HIGH | pages/customer | - | - | E2E | PLANNED |
| UI-04 | UI | Order tracking page | HIGH | pages/customer | - | - | E2E | PLANNED |
| UI-05 | UI | Reschedule interface | MEDIUM | pages/customer | - | - | E2E | PLANNED |
| UI-06 | UI | Admin dashboard | HIGH | pages/admin | - | - | E2E | PLANNED |
| UI-07 | UI | Zone/area management UI | HIGH | pages/admin | - | - | E2E | PLANNED |
| UI-08 | UI | Rate card management UI | HIGH | pages/admin | - | - | E2E | PLANNED |
| UI-09 | UI | Order management UI (admin) | HIGH | pages/admin | - | - | E2E | PLANNED |
| UI-10 | UI | Agent assignment UI | HIGH | pages/admin | - | - | E2E | PLANNED |
| UI-11 | UI | Agent dashboard | HIGH | pages/agent | - | - | E2E | PLANNED |
| UI-12 | UI | Agent delivery status update UI | HIGH | pages/agent | - | - | E2E | PLANNED |
| DEPLOY-01 | DEPLOY | Vercel deployment configuration | HIGH | config | - | - | Manual | PLANNED |
| DEPLOY-02 | DEPLOY | Supabase PostgreSQL setup | HIGH | config | - | - | Manual | PLANNED |
| DEPLOY-03 | DEPLOY | Professional README | HIGH | docs | - | - | Manual | PLANNED |
| DEPLOY-04 | DEPLOY | .env.example | HIGH | config | - | - | Manual | PLANNED |
| DEPLOY-05 | DEPLOY | API documentation | HIGH | docs | - | - | Manual | PLANNED |
| DEPLOY-06 | DEPLOY | Setup guide | MEDIUM | docs | - | - | Manual | PLANNED |
| DEPLOY-07 | DEPLOY | System design write-up (800 words max) | HIGH | docs | - | - | Manual | PLANNED |
| QUAL-01 | QUALITY | TypeScript strict mode | HIGH | config | - | - | Build | PLANNED |
| QUAL-02 | QUALITY | Zod validation on all external input | HIGH | validation | - | - | Unit | PLANNED |
| QUAL-03 | QUALITY | Centralized error handling | HIGH | middleware | - | - | Unit | PLANNED |
| QUAL-04 | QUALITY | Consistent API response format | HIGH | middleware | - | - | Unit | PLANNED |
| QUAL-05 | QUALITY | Transactional multi-step operations | HIGH | services | - | - | Integration | PLANNED |
| QUAL-06 | QUALITY | Idempotency for critical operations | MEDIUM | services | - | - | Unit | PLANNED |
| QUAL-07 | QUALITY | Lint passing | HIGH | config | - | - | CI | PLANNED |
| QUAL-08 | QUALITY | Type checking passing | HIGH | config | - | - | CI | PLANNED |
| QUAL-09 | QUALITY | Production build passing | HIGH | config | - | - | CI | PLANNED |

## Identified Ambiguities & Assumptions

A1. **Session Management (AUTH-06)** 
*Ambiguity*: Does "Session management" imply JWT or stateful sessions?
*Assumption*: Given modern web practices and deployment on Vercel with Supabase, stateless JWT tokens managed via HTTP-only cookies will be used.

A2. **COD Surcharges Application (RATE-07)**
*Ambiguity*: Are COD surcharges applied flatly or dynamically?
*Assumption*: The surcharges will apply dynamically based on total transaction volume/cart size rules stored in the `CodSurcharge` table.

A3. **Order Confirmation Flow (ORDER-06)**
*Ambiguity*: When a quote transitions to order confirmation, what happens if pricing changes?
*Assumption*: Pricing snapshots (RATE-09) ensure that the quoted amount remains valid. An internal expiration period (e.g. 15 minutes) will be enforced for quotes.

A4. **Auto-Assignment Preemption (ASSIGN-02)**
*Ambiguity*: Can manually assigned tasks be auto-reassigned if the original agent goes offline?
*Assumption*: Yes, manual overrides (ASSIGN-01) represent an intentional state, but the system will log an error and reassign upon timeout or failure events. 

A5. **Failure Notification and Rescheduling (FAIL-03, FAIL-04)**
*Ambiguity*: How long does the customer have to reschedule?
*Assumption*: We assume a maximum rescheduling window of 3 days before the order transitions to a terminal "RETURNED_TO_SENDER" status.

A6. **SMS Notifications (NOTIFY-03)**
*Ambiguity*: When are SMS notifications sent?
*Assumption*: SMS notifications will only be dispatched for critical updates (e.g. "Out for Delivery") to optimize costs.

## Requirement Coverage Summary

| Category | Total Reqs | HIGH | MEDIUM | LOW | With DB | With API | With Tests |
|----------|------------|------|--------|-----|---------|----------|------------|
| AUTH | 6 | 6 | 0 | 0 | 3 | 5 | 6 |
| ZONE | 5 | 4 | 1 | 0 | 3 | 4 | 5 |
| RATE | 11 | 10 | 1 | 0 | 4 | 5 | 11 |
| ORDER | 7 | 5 | 2 | 0 | 7 | 7 | 7 |
| LIFECYCLE| 5 | 4 | 1 | 0 | 2 | 2 | 5 |
| TRACK | 4 | 4 | 0 | 0 | 3 | 1 | 4 |
| ASSIGN | 9 | 7 | 1 | 1 | 6 | 3 | 9 |
| FAIL | 8 | 6 | 2 | 0 | 6 | 3 | 8 |
| NOTIFY | 6 | 4 | 1 | 1 | 4 | 1 | 6 |
| AGENT | 4 | 3 | 1 | 0 | 4 | 4 | 4 |
| UI | 12 | 11 | 1 | 0 | 0 | 0 | 12 |
| DEPLOY | 7 | 6 | 1 | 0 | 0 | 0 | 0 |
| QUALITY | 9 | 8 | 1 | 0 | 0 | 0 | 6 |
| **TOTAL** | **93** | **78** | **13** | **2** | **42** | **35** | **83** |
