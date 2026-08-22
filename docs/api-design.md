# API Design - LastMileX

## Overview
REST-style API using Next.js Route Handlers (App Router). All endpoints are accessible under `/api/`. The API is organized by role and resource, leveraging standard HTTP methods and status codes.

## Common Patterns

### Response Format
All API responses follow a consistent JSON structure, making it easier for clients to handle success and error states predictably.

**Success Response**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
*Note: The `meta` object is included primarily in endpoints that return paginated lists.*

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (400) - Missing or invalid parameters.
- `UNAUTHORIZED` (401) - Missing or invalid authentication token.
- `FORBIDDEN` (403) - Insufficient permissions to access the resource.
- `NOT_FOUND` (404) - Resource does not exist.
- `CONFLICT` (409) - Resource state conflict (e.g., invalid state transition, duplicate entry).
- `INTERNAL_ERROR` (500) - Unexpected server-side errors.

### Authentication
- The API expects a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).
- Authentication uses Supabase JWT tokens.
- Tokens are decoded server-side to extract the user ID and their assigned role (`ADMIN`, `CUSTOMER`, `DELIVERY_AGENT`).

### Pagination
- Standard query parameters: `page` (default `1`), `limit` (default `20`, max `100`).
- The response `meta` object will include `page`, `limit`, `total` (total records), and `totalPages`.

### Date Format
- All dates are transmitted and stored in ISO 8601 UTC format (e.g., `2026-08-22T10:33:21Z`).

---

## Authentication Endpoints

### `POST /api/auth/register`
Register a new customer account.
- **Role:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword123!",
    "name": "Jane Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_123",
        "email": "customer@example.com",
        "name": "Jane Doe",
        "role": "CUSTOMER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors:** `EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`
- **Notes:** Only `CUSTOMER` registration is permitted publicly. Agents and admins must be provisioned by an existing admin.

### `POST /api/auth/login`
Authenticate a user and obtain a JWT token.
- **Role:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_123",
        "email": "customer@example.com",
        "name": "Jane Doe",
        "role": "CUSTOMER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors:** `INVALID_CREDENTIALS`

### `GET /api/auth/me`
Retrieve the profile of the currently authenticated user.
- **Role:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_123",
        "email": "customer@example.com",
        "name": "Jane Doe",
        "role": "CUSTOMER",
        "profile": {
          "phone": "+1234567890",
          "defaultAddress": "..."
        }
      }
    }
  }
  ```

### `PUT /api/auth/profile`
Update the authenticated user's profile.
- **Role:** Authenticated
- **Request Body:**
  ```json
  {
    "name": "Jane Smith",
    "phone": "+0987654321"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_123",
        "name": "Jane Smith",
        "phone": "+0987654321"
      }
    }
  }
  ```

---

## Admin Endpoints

### Zone Management

#### `GET /api/admin/zones`
Retrieve a paginated list of all zones.
- **Role:** ADMIN
- **Query Params:** `search`, `isActive` (boolean), `page`, `limit`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "zones": [
        {
          "id": "zone_1",
          "name": "North Hub",
          "code": "NH-01",
          "description": "Northern metropolitan region",
          "isActive": true
        }
      ]
    },
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
  ```

#### `POST /api/admin/zones`
Create a new zone.
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "name": "North Hub",
    "code": "NH-01",
    "description": "Northern metropolitan region"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "zone": {
        "id": "zone_1",
        "name": "North Hub",
        "code": "NH-01",
        "isActive": true
      }
    }
  }
  ```
- **Errors:** `ZONE_CODE_EXISTS`

#### `GET /api/admin/zones/:id`
Retrieve details for a specific zone.
- **Role:** ADMIN
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "zone": {
        "id": "zone_1",
        "name": "North Hub",
        "code": "NH-01",
        "serviceAreas": [
          { "id": "sa_1", "pinCode": "10001", "name": "Downtown" }
        ]
      }
    }
  }
  ```

#### `PUT /api/admin/zones/:id`
Update an existing zone.
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "name": "North Hub Primary",
    "isActive": true
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "zone": { "id": "zone_1", "name": "North Hub Primary" }
    }
  }
  ```

#### `DELETE /api/admin/zones/:id`
Soft-delete a zone (sets `isActive = false`).
- **Role:** ADMIN
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "zone": { "id": "zone_1", "isActive": false }
    }
  }
  ```
- **Errors:** `ZONE_HAS_ACTIVE_ORDERS`

### Service Area Management

#### `GET /api/admin/service-areas`
- **Role:** ADMIN
- **Query Params:** `zoneId`, `search`, `isActive`, `page`, `limit`
- **Success Response:** Array of service areas with `meta` object.

#### `POST /api/admin/service-areas`
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "name": "Downtown",
    "pinCode": "10001",
    "locality": "Central District",
    "city": "Metropolis",
    "state": "NY",
    "zoneId": "zone_1"
  }
  ```
- **Success Response:** Service Area object.
- **Errors:** `PIN_CODE_EXISTS`, `ZONE_NOT_FOUND`

#### `PUT /api/admin/service-areas/:id`
- **Role:** ADMIN
- **Request Body:** `{ name?, pinCode?, locality?, city?, state?, zoneId?, isActive? }`

#### `DELETE /api/admin/service-areas/:id`
- **Role:** ADMIN
- Soft-delete execution.

### Rate Card Management

#### `GET /api/admin/rate-cards`
- **Role:** ADMIN
- **Query Params:** `customerType`, `routeType`, `isActive`, `page`, `limit`

#### `POST /api/admin/rate-cards`
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "name": "Standard B2C Intra-Zone 2026",
    "customerType": "B2C",
    "routeType": "INTRA_ZONE",
    "effectiveFrom": "2026-01-01T00:00:00Z",
    "weightSlabs": [
      { "minWeight": 0, "maxWeight": 5, "basePrice": 50, "perKgRate": 10 },
      { "minWeight": 5.01, "maxWeight": 20, "basePrice": 100, "perKgRate": 15 }
    ]
  }
  ```
- **Success Response:** Created rate card and nested weight slabs.
- **Errors:** `OVERLAPPING_RATE_CARD`, `OVERLAPPING_WEIGHT_SLABS`

#### `GET /api/admin/rate-cards/:id`
- **Role:** ADMIN
- Retrieves the rate card and all its weight slabs.

#### `PUT /api/admin/rate-cards/:id`
- **Role:** ADMIN
- **Request Body:** `{ name?, isActive?, effectiveTo? }`
- **Notes:** Cannot modify weight slabs or core configurations directly. A new version must be created to maintain historical pricing integrity.

#### `DELETE /api/admin/rate-cards/:id`
- **Role:** ADMIN
- Sets `effectiveTo = now()` and `isActive = false`.

### COD Surcharge Management

#### `GET /api/admin/cod-surcharges`
- **Role:** ADMIN
- **Query Params:** `routeType`, `isActive`, `page`, `limit`

#### `POST /api/admin/cod-surcharges`
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "routeType": "INTRA_ZONE",
    "surchargeType": "PERCENTAGE",
    "surchargeValue": 2.5,
    "minSurcharge": 20,
    "maxSurcharge": 100,
    "effectiveFrom": "2026-01-01T00:00:00Z"
  }
  ```

#### `PUT /api/admin/cod-surcharges/:id`
- **Role:** ADMIN
- **Request Body:** `{ isActive?, effectiveTo? }`

#### `DELETE /api/admin/cod-surcharges/:id`
- **Role:** ADMIN
- Soft-delete.

### Agent Management

#### `GET /api/admin/agents`
- **Role:** ADMIN
- **Query Params:** `availability`, `zoneId`, `search`, `page`, `limit`

#### `POST /api/admin/agents`
Create a new delivery agent.
- **Role:** ADMIN
- **Request Body:**
  ```json
  {
    "email": "agent.smith@lastmilex.com",
    "password": "TempPassword123!",
    "name": "Agent Smith",
    "phone": "+1987654321",
    "vehicleType": "BIKE",
    "vehicleNumber": "NY-1234",
    "currentZoneId": "zone_1",
    "maxConcurrentOrders": 5
  }
  ```
- **Notes:** Creates a User record with role `DELIVERY_AGENT` and an associated `DeliveryAgentProfile`.

#### `GET /api/admin/agents/:id`
- **Role:** ADMIN
- **Response:** Agent details including active assignments.

#### `PUT /api/admin/agents/:id`
- **Role:** ADMIN
- Update agent details (name, phone, vehicle, zone, capacity, isActive status).

### Order Management (Admin)

#### `GET /api/admin/orders`
- **Role:** ADMIN
- **Query Params:** `status`, `customerId`, `agentId`, `zoneId`, `dateFrom`, `dateTo`, `orderNumber`, `page`, `limit`, `sortBy`, `sortOrder`

#### `GET /api/admin/orders/:id`
- **Role:** ADMIN
- **Response:** Comprehensive order document including `trackingEvents`, `assignments`, `attempts`, and `pricingSnapshot`.

#### `POST /api/admin/orders`
- **Role:** ADMIN
- **Notes:** Creates an order on behalf of a customer. Uses the same payload as customer order creation, plus a `customerId`.

#### `PUT /api/admin/orders/:id/status`
- **Role:** ADMIN
- **Request Body:** `{ "status": "DELIVERED", "note": "Admin manual override" }`
- **Notes:** Admins can bypass standard status transition constraints. Requires an audit trail note.

#### `PUT /api/admin/orders/:id/assign`
Assign an order to a specific agent manually.
- **Role:** ADMIN
- **Request Body:** `{ "agentId": "agent_123" }`
- **Errors:** `AGENT_NOT_FOUND`, `AGENT_UNAVAILABLE`, `AGENT_AT_CAPACITY`, `INVALID_ORDER_STATUS`

#### `POST /api/admin/orders/:id/auto-assign`
Trigger auto-assignment for an order based on logic (zone, capacity, availability).
- **Role:** ADMIN
- **Request Body:** `{}`
- **Errors:** `NO_SUITABLE_AGENT`, `INVALID_ORDER_STATUS`

---

## Customer Endpoints

### `POST /api/customer/quotes`
Generate a pricing quote for a shipment.
- **Role:** CUSTOMER
- **Request Body:**
  ```json
  {
    "pickupPinCode": "10001",
    "dropPinCode": "10002",
    "packageLength": 20,
    "packageBreadth": 15,
    "packageHeight": 10,
    "actualWeight": 2.5,
    "customerType": "B2C",
    "paymentType": "PREPAID"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "quote": {
        "volumetricWeight": 0.6,
        "chargeableWeight": 2.5,
        "pickupZone": "zone_1",
        "dropZone": "zone_1",
        "routeType": "INTRA_ZONE",
        "baseCharge": 50,
        "codSurcharge": 0,
        "totalCharge": 50,
        "rateCardId": "rc_1",
        "weightSlabId": "ws_1",
        "breakdown": {
          "base": 50,
          "taxes": 0
        }
      }
    }
  }
  ```
- **Errors:** `UNSUPPORTED_PICKUP_AREA`, `UNSUPPORTED_DROP_AREA`, `NO_RATE_CARD_FOUND`, `INVALID_DIMENSIONS`

### `POST /api/customer/orders`
Create a new order in `CREATED` state.
- **Role:** CUSTOMER
- **Request Body:**
  ```json
  {
    "pickupAddress": "123 Startup Blvd",
    "pickupPinCode": "10001",
    "dropAddress": "456 Enterprise Way",
    "dropPinCode": "10002",
    "dropContactName": "Bob Client",
    "dropContactPhone": "+1122334455",
    "packageLength": 20,
    "packageBreadth": 15,
    "packageHeight": 10,
    "actualWeight": 2.5,
    "customerType": "B2C",
    "paymentType": "PREPAID"
  }
  ```
- **Success Response (201 Created):** Order object including generated `pricingSnapshot`.

### `PUT /api/customer/orders/:id/confirm`
Confirm an order, locking the pricing and preparing it for processing.
- **Role:** CUSTOMER (owner only)
- **Request Body:** `{}`
- **Transition:** `CREATED` → `CONFIRMED`
- **Errors:** `INVALID_STATUS_TRANSITION`, `ORDER_NOT_FOUND`, `NOT_ORDER_OWNER`

### `GET /api/customer/orders`
- **Role:** CUSTOMER
- **Query Params:** `status`, `page`, `limit`
- **Notes:** Automatically filtered to only return the authenticated customer's orders.

### `GET /api/customer/orders/:id`
- **Role:** CUSTOMER (owner only)
- Retrieves complete order details.

### `GET /api/customer/orders/:id/tracking`
- **Role:** CUSTOMER (owner only)
- **Response:** Array of `trackingEvents` ordered chronologically.

### `POST /api/customer/orders/:id/reschedule`
Reschedule a failed delivery.
- **Role:** CUSTOMER (owner only)
- **Request Body:** `{ "scheduledDate": "2026-08-25T00:00:00Z" }`
- **Transition:** `FAILED` → `RESCHEDULED`
- **Errors:** `ORDER_NOT_FAILED`, `MAX_ATTEMPTS_REACHED`, `INVALID_DATE`

### `PUT /api/customer/orders/:id/cancel`
Cancel an order before it has been processed.
- **Role:** CUSTOMER (owner only)
- **Request Body:** `{ "reason": "Changed my mind" }`
- **Transition:** `CREATED` | `CONFIRMED` → `CANCELLED`
- **Errors:** `INVALID_STATUS_TRANSITION`

---

## Delivery Agent Endpoints

### `GET /api/agent/orders`
Retrieve orders assigned to the authenticated delivery agent.
- **Role:** DELIVERY_AGENT
- **Query Params:** `status`, `page`, `limit`
- **Notes:** Filters out orders not currently assigned to the agent.

### `GET /api/agent/orders/:id`
- **Role:** DELIVERY_AGENT (assigned only)
- Fetch detailed instructions for a specific assigned order.

### `PUT /api/agent/orders/:id/status`
Update the tracking status of an order during delivery.
- **Role:** DELIVERY_AGENT (assigned only)
- **Request Body:**
  ```json
  {
    "status": "DELIVERED",
    "note": "Left at front door"
  }
  ```
- **Allowed Transitions:**
  - `ASSIGNED` → `PICKED_UP`
  - `PICKED_UP` → `IN_TRANSIT`
  - `IN_TRANSIT` → `OUT_FOR_DELIVERY`
  - `OUT_FOR_DELIVERY` → `DELIVERED`
  - `OUT_FOR_DELIVERY` → `FAILED` (Requires `failureReason`)
- **Errors:** `INVALID_STATUS_TRANSITION`, `NOT_ASSIGNED_TO_ORDER`

### `PUT /api/agent/availability`
Update working status.
- **Role:** DELIVERY_AGENT
- **Request Body:** `{ "availability": "AVAILABLE" }` (Enums: `AVAILABLE`, `BUSY`, `OFFLINE`)

### `PUT /api/agent/location`
Update current geospatial location.
- **Role:** DELIVERY_AGENT
- **Request Body:**
  ```json
  {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- **Response:** Updated profile snippet with timestamps.

---

## Validation Rules

All API payloads are strictly validated using Zod on the server. Below are the key constraints for resources:

### General Types & Constraints
- **UUIDs**: All IDs (`zoneId`, `agentId`, `orderId`) must be valid UUID strings.
- **Dates**: Must parse to valid ISO 8601 UTC date strings. Scheduled dates must be in the future.
- **Strings**: Truncated or stripped of excessive whitespace. Usually limited to max `255` characters unless it's a `description` or `note` (max `1000` chars).
- **Enums**: Must exactly match the defined string literals.

### Dimensions & Weight (Orders / Quotes)
- `packageLength`, `packageBreadth`, `packageHeight`: Number, `min: 0.1` (cm)
- `actualWeight`: Number, `min: 0.01` (kg)

### Enums Used
- **Role**: `ADMIN`, `CUSTOMER`, `DELIVERY_AGENT`
- **CustomerType**: `B2B`, `B2C`
- **PaymentType**: `PREPAID`, `COD`
- **RouteType**: `INTRA_ZONE`, `INTER_ZONE`
- **SurchargeType**: `FLAT`, `PERCENTAGE`
- **AgentAvailability**: `AVAILABLE`, `BUSY`, `OFFLINE`
- **OrderStatus**: `CREATED`, `CONFIRMED`, `CANCELLED`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RESCHEDULED`

### Formatting
- **Email**: Standard email format validation (`z.string().email()`).
- **Phone**: E.164 standard formatting or standard regex (e.g., `^\+?[1-9]\d{1,14}$`).
- **PinCode**: String, alphanumeric, length `5-10` characters depending on region (e.g., standard US Zip `^\d{5}$` or general `^[a-zA-Z0-9\s-]{3,10}$`).

---

## Rate Limiting

To ensure API stability and fair usage, rate limiting is implemented globally at the edge/middleware level:

- **Public Endpoints (Authentication):**
  - Limit: 10 requests / minute per IP address.
  - Prevents brute-force login attempts and spam registrations.

- **Authenticated Endpoints (Standard API calls):**
  - Limit: 100 requests / minute per authenticated User ID.
  - Generous enough for normal operations (Admin bulk actions, Agent updates).

- **Quote Endpoint (`/api/customer/quotes`):**
  - Limit: 30 requests / minute per authenticated User ID.
  - Prevents excessive load on the pricing engine.

*Exceeding these limits will result in a `429 Too Many Requests` HTTP response.*
