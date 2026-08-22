-- ====================================================================
-- LastMileX: PostgreSQL Row Level Security (RLS) & Server-Only Strategy
-- ====================================================================
-- Architecture Summary:
-- 1. All domain data reads, writes, transactions, and business logic 
--    flow server-side through Next.js Route Handlers / Services via Prisma.
-- 2. Client-side browser access via Supabase anon key is strictly restricted 
--    to authentication session management (auth.users).
-- 3. The policies below enforce database-level isolation so that direct 
--    browser queries cannot bypass business authorization rules.
-- ====================================================================

-- Enable RLS on all public application tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_surcharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_pricing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 1. Immutable Audit Tables (OrderTrackingEvent)
-- Prohibit UPDATE and DELETE completely at the database level.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_tracking_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'OrderTrackingEvent records are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_immutable_tracking_events
BEFORE UPDATE OR DELETE ON order_tracking_events
FOR EACH ROW
EXECUTE FUNCTION prevent_tracking_event_mutation();

-- --------------------------------------------------------------------
-- 2. Service Role & Prisma Bypass
-- Prisma connects directly using the server DATABASE_URL (superuser/postgres role)
-- which bypasses RLS for trusted server-side execution.
-- Public anon / authenticated Supabase client roles are restricted below.
-- --------------------------------------------------------------------

-- User Profile access policy for Supabase authenticated client
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Customer orders access policy
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Agent assigned orders access policy
CREATE POLICY "Agents can view assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agent_assignments
    WHERE agent_assignments.order_id = orders.id
      AND agent_assignments.agent_id = auth.uid()
      AND agent_assignments.status = 'ACTIVE'
  )
);
