-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CUSTOMER', 'DELIVERY_AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "agent_availability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "route_type" AS ENUM ('INTRA_ZONE', 'INTER_ZONE');

-- CreateEnum
CREATE TYPE "surcharge_type" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('CREATED', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "assignment_type" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('ACTIVE', 'COMPLETED', 'REASSIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "attempt_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "notification_event_type" AS ENUM ('ORDER_CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED', 'ORDER_CANCELLED');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'CUSTOMER',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "default_pickup_address" TEXT,
    "default_pickup_pin_code" TEXT,
    "company_name" TEXT,
    "customer_type" "customer_type" NOT NULL DEFAULT 'B2C',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_agent_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "availability" "agent_availability" NOT NULL DEFAULT 'OFFLINE',
    "current_zone_id" UUID,
    "max_concurrent_orders" INTEGER NOT NULL DEFAULT 5,
    "vehicle_type" TEXT,
    "vehicle_number" TEXT,
    "last_known_latitude" DECIMAL(10,7),
    "last_known_longitude" DECIMAL(10,7),
    "last_location_update_at" TIMESTAMP(3),
    "active_delivery_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_areas" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "pin_code" TEXT NOT NULL,
    "locality" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zone_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "route_type" "route_type" NOT NULL,
    "source_zone_id" UUID,
    "destination_zone_id" UUID,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_slabs" (
    "id" UUID NOT NULL,
    "rate_card_id" UUID NOT NULL,
    "min_weight" DECIMAL(10,2) NOT NULL,
    "max_weight" DECIMAL(10,2) NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "per_kg_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cod_surcharges" (
    "id" UUID NOT NULL,
    "route_type" "route_type" NOT NULL,
    "surcharge_type" "surcharge_type" NOT NULL,
    "surcharge_value" DECIMAL(10,2) NOT NULL,
    "min_surcharge" DECIMAL(10,2),
    "max_surcharge" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cod_surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'CREATED',
    "pickup_address" TEXT NOT NULL,
    "pickup_pin_code" TEXT NOT NULL,
    "pickup_zone_id" UUID NOT NULL,
    "drop_address" TEXT NOT NULL,
    "drop_pin_code" TEXT NOT NULL,
    "drop_zone_id" UUID NOT NULL,
    "route_type" "route_type" NOT NULL,
    "package_length" DECIMAL(10,2) NOT NULL,
    "package_breadth" DECIMAL(10,2) NOT NULL,
    "package_height" DECIMAL(10,2) NOT NULL,
    "actual_weight" DECIMAL(10,2) NOT NULL,
    "volumetric_weight" DECIMAL(10,2) NOT NULL,
    "chargeable_weight" DECIMAL(10,2) NOT NULL,
    "payment_type" TEXT NOT NULL,
    "total_charge" DECIMAL(10,2) NOT NULL,
    "base_charge" DECIMAL(10,2) NOT NULL,
    "cod_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "scheduled_delivery_date" TIMESTAMP(3),
    "current_attempt" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_pricing_snapshots" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "rate_card_id" UUID NOT NULL,
    "rate_card_name" TEXT NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "route_type" "route_type" NOT NULL,
    "weight_slab_id" UUID NOT NULL,
    "min_weight" DECIMAL(10,2) NOT NULL,
    "max_weight" DECIMAL(10,2) NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "per_kg_rate" DECIMAL(10,2) NOT NULL,
    "chargeable_weight" DECIMAL(10,2) NOT NULL,
    "base_charge" DECIMAL(10,2) NOT NULL,
    "cod_surcharge_rule_id" UUID,
    "cod_surcharge_type" "surcharge_type",
    "cod_surcharge_value" DECIMAL(10,2),
    "cod_surcharge_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_charge" DECIMAL(10,2) NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pricing_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_assignments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_id" UUID NOT NULL,
    "assignment_type" "assignment_type" NOT NULL DEFAULT 'MANUAL',
    "status" "assignment_status" NOT NULL DEFAULT 'ACTIVE',
    "completed_at" TIMESTAMP(3),
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "agent_id" UUID,
    "status" "attempt_status" NOT NULL DEFAULT 'PENDING',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "failure_reason" TEXT,
    "failed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rescheduled_by_id" UUID,
    "rescheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tracking_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "previous_status" "order_status",
    "new_status" "order_status" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID NOT NULL,
    "actor_role" "user_role" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "type" "notification_type" NOT NULL,
    "channel" TEXT NOT NULL,
    "event_type" "notification_event_type" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_agent_profiles_user_id_key" ON "delivery_agent_profiles"("user_id");
CREATE INDEX "delivery_agent_profiles_availability_idx" ON "delivery_agent_profiles"("availability");
CREATE INDEX "delivery_agent_profiles_current_zone_id_idx" ON "delivery_agent_profiles"("current_zone_id");
CREATE INDEX "delivery_agent_profiles_availability_current_zone_id_idx" ON "delivery_agent_profiles"("availability", "current_zone_id");

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");
CREATE INDEX "zones_code_idx" ON "zones"("code");
CREATE INDEX "zones_is_active_idx" ON "zones"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_areas_pin_code_key" ON "service_areas"("pin_code");
CREATE INDEX "service_areas_pin_code_idx" ON "service_areas"("pin_code");
CREATE INDEX "service_areas_zone_id_idx" ON "service_areas"("zone_id");
CREATE INDEX "service_areas_pin_code_is_active_idx" ON "service_areas"("pin_code", "is_active");

-- CreateIndex
CREATE INDEX "rate_cards_source_zone_id_idx" ON "rate_cards"("source_zone_id");
CREATE INDEX "rate_cards_destination_zone_id_idx" ON "rate_cards"("destination_zone_id");
CREATE UNIQUE INDEX "rate_cards_customer_type_route_type_source_zone_id_destinat_key" ON "rate_cards"("customer_type", "route_type", "source_zone_id", "destination_zone_id", "effective_from");
CREATE INDEX "rate_cards_customer_type_route_type_is_active_effective_from_idx" ON "rate_cards"("customer_type", "route_type", "is_active", "effective_from");

-- CreateIndex
CREATE INDEX "weight_slabs_rate_card_id_idx" ON "weight_slabs"("rate_card_id");
CREATE INDEX "weight_slabs_rate_card_id_min_weight_idx" ON "weight_slabs"("rate_card_id", "min_weight");

-- CreateIndex
CREATE INDEX "cod_surcharges_route_type_is_active_effective_from_idx" ON "cod_surcharges"("route_type", "is_active", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_pickup_zone_id_idx" ON "orders"("pickup_zone_id");
CREATE INDEX "orders_drop_zone_id_idx" ON "orders"("drop_zone_id");
CREATE INDEX "orders_customer_id_status_idx" ON "orders"("customer_id", "status");
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_pricing_snapshots_order_id_key" ON "order_pricing_snapshots"("order_id");
CREATE INDEX "order_pricing_snapshots_order_id_idx" ON "order_pricing_snapshots"("order_id");

-- CreateIndex
CREATE INDEX "agent_assignments_order_id_idx" ON "agent_assignments"("order_id");
CREATE INDEX "agent_assignments_agent_id_idx" ON "agent_assignments"("agent_id");
CREATE INDEX "agent_assignments_agent_id_status_idx" ON "agent_assignments"("agent_id", "status");
CREATE INDEX "agent_assignments_order_id_status_idx" ON "agent_assignments"("order_id", "status");

-- CreateIndex
CREATE INDEX "delivery_attempts_order_id_idx" ON "delivery_attempts"("order_id");
CREATE INDEX "delivery_attempts_agent_id_idx" ON "delivery_attempts"("agent_id");
CREATE UNIQUE INDEX "delivery_attempts_order_id_attempt_number_key" ON "delivery_attempts"("order_id", "attempt_number");

-- CreateIndex
CREATE INDEX "order_tracking_events_order_id_idx" ON "order_tracking_events"("order_id");
CREATE INDEX "order_tracking_events_order_id_timestamp_idx" ON "order_tracking_events"("order_id", "timestamp");
CREATE INDEX "order_tracking_events_actor_id_idx" ON "order_tracking_events"("actor_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_order_id_idx" ON "notifications"("order_id");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_status_created_at_idx" ON "notifications"("status", "created_at");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agent_profiles" ADD CONSTRAINT "delivery_agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agent_profiles" ADD CONSTRAINT "delivery_agent_profiles_current_zone_id_fkey" FOREIGN KEY ("current_zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_source_zone_id_fkey" FOREIGN KEY ("source_zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_destination_zone_id_fkey" FOREIGN KEY ("destination_zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_slabs" ADD CONSTRAINT "weight_slabs_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_zone_id_fkey" FOREIGN KEY ("pickup_zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_drop_zone_id_fkey" FOREIGN KEY ("drop_zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pricing_snapshots" ADD CONSTRAINT "order_pricing_snapshots_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pricing_snapshots" ADD CONSTRAINT "order_pricing_snapshots_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pricing_snapshots" ADD CONSTRAINT "order_pricing_snapshots_weight_slab_id_fkey" FOREIGN KEY ("weight_slab_id") REFERENCES "weight_slabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pricing_snapshots" ADD CONSTRAINT "order_pricing_snapshots_cod_surcharge_rule_id_fkey" FOREIGN KEY ("cod_surcharge_rule_id") REFERENCES "cod_surcharges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_rescheduled_by_id_fkey" FOREIGN KEY ("rescheduled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tracking_events" ADD CONSTRAINT "order_tracking_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tracking_events" ADD CONSTRAINT "order_tracking_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------
-- Row Level Security (RLS) & Immutability Trigger
-- --------------------------------------------------------------------

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_agent_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_areas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weight_slabs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cod_surcharges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_pricing_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_tracking_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION prevent_tracking_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'OrderTrackingEvent records are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_immutable_tracking_events ON "order_tracking_events";
CREATE TRIGGER enforce_immutable_tracking_events
BEFORE UPDATE OR DELETE ON "order_tracking_events"
FOR EACH ROW
EXECUTE FUNCTION prevent_tracking_event_mutation();

-- RLS Policies for Supabase authenticated client roles
CREATE POLICY "Users can view own profile"
ON "users" FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Customers can view own orders"
ON "orders" FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Agents can view assigned orders"
ON "orders" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "agent_assignments"
    WHERE "agent_assignments"."order_id" = "orders"."id"
      AND "agent_assignments"."agent_id" = auth.uid()
      AND "agent_assignments"."status" = 'ACTIVE'
  )
);
