import { PrismaClient, OrderStatus, AssignmentStatus, AttemptStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying seed data...\n");

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      emailVerified: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("📋 Users:");
  users.forEach((u) => {
    console.log(`  - ${u.email} (${u.role}) - ${u.name} - Verified: ${u.emailVerified}`);
  });

  const expectedPersonas = [
    { email: process.env.SEED_ADMIN_EMAIL || "admin@lastmilex.com", role: "ADMIN" },
    { email: process.env.SEED_AGENT_EMAIL || "agent@lastmilex.com", role: "DELIVERY_AGENT" },
    { email: process.env.SEED_CUSTOMER_EMAIL || "customer@example.com", role: "CUSTOMER" },
  ];
  let errors = 0;
  const expectedEmailSet = new Set(expectedPersonas.map((persona) => persona.email));
  if (users.length !== expectedPersonas.length || users.some((user) => !expectedEmailSet.has(user.email))) {
    console.log("  ❌ ERROR: Expected exactly the three seeded persona application users");
    errors++;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase Auth verification requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) throw new Error(`Failed to verify Supabase Auth users: ${authError.message}`);
  for (const persona of expectedPersonas) {
    const applicationUser = users.find((user) => user.email === persona.email);
    const authUser = authUsers.users.find((user) => user.email === persona.email);
    if (!applicationUser || applicationUser.role !== persona.role || !authUser || applicationUser.id !== authUser.id) {
      console.log(`  ❌ ERROR: Supabase Auth identity mismatch for ${persona.email}`);
      errors++;
    }
  }
  console.log("  ✅ Persona application IDs match Supabase Auth IDs");

  // Check zones
  const zones = await prisma.zone.findMany();
  console.log(`\n📍 Zones: ${zones.length}`);
  zones.forEach((z) => console.log(`  - ${z.code}: ${z.name}`));

  // Check service areas
  const serviceAreas = await prisma.serviceArea.findMany();
  console.log(`\n🏘️  Service Areas: ${serviceAreas.length}`);

  // Check rate cards
  const rateCards = await prisma.rateCard.findMany({
    include: { weightSlabs: true },
  });
  console.log(`\n💰 Rate Cards: ${rateCards.length}`);
  rateCards.forEach((rc) => {
    console.log(`  - ${rc.name} (${rc.weightSlabs.length} slabs)`);
  });

  // Check COD surcharges
  const codSurcharges = await prisma.codSurcharge.findMany();
  console.log(`\n💵 COD Surcharges: ${codSurcharges.length}`);

  // Check agent profiles
  const agents = await prisma.deliveryAgentProfile.findMany({
    include: { user: true },
  });
  console.log(`\n🚚 Delivery Agents: ${agents.length}`);
  agents.forEach((a) => {
    console.log(`  - ${a.user.name} (${a.user.email}) - ${a.availability}`);
  });

  // Check customer profiles
  const customers = await prisma.customerProfile.findMany({
    include: { user: true },
  });
  console.log(`\n👥 Customers: ${customers.length}`);
  customers.forEach((c) => {
    console.log(`  - ${c.user.name} (${c.user.email}) - ${c.customerType}`);
  });

  // Check order lifecycle fixtures
  console.log("\n📦 Order Lifecycle Fixtures:");
  const expectedOrderNumbers = [
    "LMX-2026-001",
    "LMX-2026-002",
    "LMX-2026-003",
    "LMX-2026-004",
    "LMX-2026-005",
    "LMX-2026-006",
    "LMX-2026-010",
    "LMX-2026-011",
  ];
  const orders = await prisma.order.findMany({
    where: {
      orderNumber: { in: expectedOrderNumbers },
    },
    include: {
      customer: { select: { email: true } },
      pricingSnapshot: true,
      assignments: {
        include: { agent: { select: { role: true } } },
      },
      attempts: { orderBy: { attemptNumber: "asc" } },
      trackingEvents: { orderBy: { timestamp: "asc" } },
    },
    orderBy: { orderNumber: "asc" },
  });

  console.log(`  Total orders: ${orders.length}`);

  // Verify each order
  if (orders.length !== expectedOrderNumbers.length) {
    console.log(`    ❌ ERROR: Expected ${expectedOrderNumbers.length} lifecycle fixtures`);
    errors++;
  }
  for (const order of orders) {
    console.log(`\n  📋 Order ${order.orderNumber} (${order.status}):`);

    // Check pricing snapshot
    if (!order.pricingSnapshot) {
      console.log(`    ❌ ERROR: Missing pricing snapshot`);
      errors++;
    } else {
      console.log(`    ✅ Pricing snapshot: ₹${order.pricingSnapshot.totalCharge}`);
    }

    // Check tracking events
    console.log(`    ✅ Tracking events: ${order.trackingEvents.length}`);

    // Check attempts monotonicity
    const attemptNumbers = order.attempts.map((a) => a.attemptNumber);
    const isMonotonic = attemptNumbers.every((n, i) => i === 0 || n > attemptNumbers[i - 1]);
    if (!isMonotonic) {
      console.log(`    ❌ ERROR: Attempt numbers not monotonic`);
      errors++;
    } else {
      console.log(`    ✅ Attempts: ${order.attempts.length} (monotonic)`);
    }

    const lifecycle = order.trackingEvents.map((event) => event.newStatus);
    const expectedLifecycle =
      order.status === OrderStatus.RESCHEDULED
        ? [
            OrderStatus.CREATED,
            OrderStatus.CONFIRMED,
            OrderStatus.ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.FAILED,
            OrderStatus.RESCHEDULED,
          ]
        : order.status === OrderStatus.FAILED
        ? [
            OrderStatus.CREATED,
            OrderStatus.CONFIRMED,
            OrderStatus.ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.FAILED,
          ]
        : [OrderStatus.CREATED, ...(order.status === OrderStatus.CREATED ? [] : [OrderStatus.CONFIRMED])];
    if (
      order.status === OrderStatus.RESCHEDULED ||
      order.status === OrderStatus.FAILED
    ) {
      const matchesLifecycle =
        lifecycle.length === expectedLifecycle.length &&
        lifecycle.every((status, index) => status === expectedLifecycle[index]);
      if (!matchesLifecycle) {
        console.log(`    ❌ ERROR: Tracking lifecycle does not match ${order.status}`);
        errors++;
      }
    }

    // Check assignments for non-CREATED orders
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.RESCHEDULED) {
      if (order.assignments.length === 0) {
        console.log(`    ❌ ERROR: Non-CREATED order has no assignments`);
        errors++;
      } else {
        console.log(`    ✅ Assignments: ${order.assignments.length}`);
        if (order.assignments.some((assignment) => assignment.agent.role !== "DELIVERY_AGENT")) {
          console.log(`    ❌ ERROR: Assignment points to a non-agent user`);
          errors++;
        }
      }
    }

    // Check terminal state consistency
    if (order.status === OrderStatus.DELIVERED) {
      const deliveredAttempt = order.attempts.find((a) => a.status === AttemptStatus.DELIVERED);
      if (!deliveredAttempt) {
        console.log(`    ❌ ERROR: DELIVERED order has no DELIVERED attempt`);
        errors++;
      }
      const completedAssignment = order.assignments.find((a) => a.status === AssignmentStatus.COMPLETED);
      if (!completedAssignment) {
        console.log(`    ❌ ERROR: DELIVERED order has no COMPLETED assignment`);
        errors++;
      }
    }

    if (order.status === OrderStatus.FAILED) {
      const failedAttempt = order.attempts.find((a) => a.status === AttemptStatus.FAILED);
      if (!failedAttempt) {
        console.log(`    ❌ ERROR: FAILED order has no FAILED attempt`);
        errors++;
      }
      if (!failedAttempt?.failureReason) {
        console.log(`    ❌ ERROR: FAILED attempt has no failure reason`);
        errors++;
      }
    }

    if (order.status === OrderStatus.RESCHEDULED) {
      if (order.currentAttempt < 2) {
        console.log(`    ❌ ERROR: RESCHEDULED order should have currentAttempt >= 2`);
        errors++;
      }
      const failedAttempt = order.attempts.find((a) => a.status === AttemptStatus.FAILED);
      if (!failedAttempt) {
        console.log(`    ❌ ERROR: RESCHEDULED order has no FAILED attempt history`);
        errors++;
      }
      if (order.assignments.some((assignment) => assignment.status === AssignmentStatus.ACTIVE)) {
        console.log(`    ❌ ERROR: RESCHEDULED order has an active assignment before retry`);
        errors++;
      }
    }
  }

  // Verify agent workload consistency
  console.log("\n🚚 Agent Workload Verification:");
  for (const agent of agents) {
    const activeAssignments = await prisma.agentAssignment.count({
      where: {
        agentId: agent.userId,
        status: AssignmentStatus.ACTIVE,
      },
    });
    if (agent.activeDeliveryCount !== activeAssignments) {
      console.log(
        `  ❌ ERROR: Agent ${agent.user.name} activeDeliveryCount (${agent.activeDeliveryCount}) != active assignments (${activeAssignments})`
      );
      errors++;
    } else {
      console.log(`  ✅ Agent ${agent.user.name}: ${activeAssignments} active assignments`);
    }

    if (agent.activeDeliveryCount > agent.maxConcurrentOrders) {
      console.log(
        `  ❌ ERROR: Agent ${agent.user.name} exceeds maxConcurrentOrders (${agent.maxConcurrentOrders})`
      );
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  if (errors === 0) {
    console.log("✅ All seed verification checks passed!");
  } else {
    console.log(`❌ ${errors} verification error(s) found`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
