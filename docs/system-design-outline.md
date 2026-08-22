# System Design - LastMileX

## Document Purpose
This is the system design write-up for LastMileX, a last-mile delivery management platform. It covers the four critical subsystems: Rate Calculation Engine, Zone Detection, Auto-Assignment Logic, and Failed Delivery Handling.

## 1. Rate Calculation Engine
The rate engine computes delivery charges dynamically from database-configured rules. No pricing logic is hardcoded.

**Architecture**: Pure service module with no framework dependencies. Takes structured input (addresses, dimensions, weight, order type, payment type) and returns deterministic pricing.

**Calculation Flow**:
1. Extract PIN codes from pickup and drop addresses.
2. Resolve each PIN to a Zone via ServiceArea lookup.
3. Determine route type: intra-zone (same zone) or inter-zone.
4. Compute volumetric weight: L × B × H ÷ 5000.
5. Chargeable weight = MAX(actual, volumetric), rounded up to nearest 0.5 kg.
6. Look up active rate card matching: customer type (B2B/B2C) + route type + zone pair + current date.
7. Find weight slab containing the chargeable weight.
8. Base charge = slab.basePrice + (overweight × slab.perKgRate).
9. If COD payment: apply surcharge (flat or percentage with min/max caps).
10. Total = base charge + COD surcharge.

**Historical Integrity**: At order creation, a complete OrderPricingSnapshot is stored immutably. Rate card changes use versioning via effectiveFrom dates — existing orders are never affected.

## 2. Zone Detection
Zone detection maps delivery addresses to geographic zones for routing and pricing.

**Approach**: PIN code → ServiceArea → Zone mapping. Admins configure zones and associate service areas (with PIN codes) to them. This avoids external geocoding API dependencies while providing reliable zone resolution for Indian logistics.

**Resolution**: Each PIN code maps to exactly one service area, which belongs to one zone. If a PIN isn't found, the system returns an UNSUPPORTED_AREA error, preventing order creation for unserviced areas.

**Future Path**: The architecture supports adding geocoding (Google Maps/Mapbox) as a supplementary resolution strategy without changing the core zone model.

## 3. Auto-Assignment Logic
The assignment system matches delivery agents to orders using a deterministic, explainable scoring algorithm.

**Candidate Filtering**: Available agents (status = AVAILABLE, activeDeliveryCount < max) are filtered by pickup zone match. If no zone-matching agents exist, the search expands to all available agents.

**Scoring** (100-point scale):
- Zone match: 40 points (exact zone match)
- Workload: 30 points (inverse of current load ratio)
- Proximity: 20 points (distance tiers from last-known location)
- Recency: 10 points (recently active agents preferred)

**Tie-breaking**: Lowest workload → earliest registration date (deterministic).

**Concurrency Protection**: SELECT FOR UPDATE locks both agent and order rows within a transaction. If the selected agent becomes unavailable mid-transaction, the system retries with the next-best candidate (up to 3 retries).

**Availability Model**: Three states — AVAILABLE (ready), BUSY (at max capacity, system-managed), OFFLINE (not working). BUSY transitions are automatic when assignment count reaches the agent's configured maximum.

## 4. Failed Delivery Handling
Failed deliveries follow a structured recovery workflow with full auditability.

**Failure Flow**:
1. Agent marks delivery as FAILED with a mandatory reason.
2. Immutable tracking event created with failure details.
3. Customer notified with reschedule option.
4. Agent's assignment marked completed; workload decremented.

**Rescheduling**:
1. Customer selects new delivery date (must be future date).
2. System validates attempt count < maximum (default 3).
3. New DeliveryAttempt record created; order status → RESCHEDULED.
4. Order re-enters the assignment pool.
5. Fresh agent assignment (manual or auto) for the new attempt.

**Safeguards**:
- Maximum attempt limit prevents infinite retry loops.
- Each attempt is a separate DeliveryAttempt record (full history preserved).
- Idempotency checks prevent duplicate reschedule requests.
- Previous agents are not excluded from reassignment (they may still be optimal).
- All status transitions create immutable tracking events for complete audit trail.

**Terminal States**: After max attempts, the order remains FAILED. Admin can cancel or make special arrangements.
