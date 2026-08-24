import {
  PrismaClient,
  UserRole,
  CustomerType,
  AgentAvailability,
  RouteType,
  SurchargeType,
  OrderStatus,
  PaymentType,
  AssignmentType,
  AssignmentStatus,
  AttemptStatus,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@lastmilex.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SEED_AGENT_EMAIL = process.env.SEED_AGENT_EMAIL || "agent@lastmilex.com";
const SEED_AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD;
const SEED_CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || "customer@example.com";
const SEED_CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD;

type OrderFixture = {
  orderNumber: string;
  status: OrderStatus;
  customerEmail: string;
  pickupPinCode: string;
  dropPinCode: string;
  routeType: RouteType;
  actualWeight: number;
  volumetricWeight: number;
  paymentType: PaymentType;
  description: string;
  assignedAgentEmail?: string;
  failureReason?: string;
  currentAttempt?: number;
};

async function createSupabaseAuthUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase Auth seed requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) throw new Error(`Failed to list Supabase Auth users: ${listError.message}`);

  async function findOrCreateUser(email: string, password: string | undefined, name: string) {
    const existingUser = userList.users.find((user) => user.email === email);
    if (existingUser) return existingUser;
    if (!password) throw new Error(`Missing seed password for new Auth user ${email}`);
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message || "unknown error"}`);
    return data.user;
  }

  const adminUser = await findOrCreateUser(SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, "System Admin");
  const agentUser = await findOrCreateUser(SEED_AGENT_EMAIL, SEED_AGENT_PASSWORD, "Rajesh Kumar");
  const customerUser = await findOrCreateUser(SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_PASSWORD, "Anita Sharma");
  console.log("✅ Supabase Auth users are available");

  return { adminId: adminUser.id, agentId: agentUser.id, customerId: customerUser.id };
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Supabase Auth users first and use their IDs in public.users.
  const { adminId, agentId, customerId } = await createSupabaseAuthUsers();

  // 1. Seed Zones
  const northZone = await prisma.zone.upsert({
    where: { code: "ZONE-NORTH" },
    update: {},
    create: {
      name: "North Delivery Zone",
      code: "ZONE-NORTH",
      description: "Northern metropolitan and suburban regions",
      isActive: true,
    },
  });

  const southZone = await prisma.zone.upsert({
    where: { code: "ZONE-SOUTH" },
    update: {},
    create: {
      name: "South Delivery Zone",
      code: "ZONE-SOUTH",
      description: "Southern metropolitan and commercial regions",
      isActive: true,
    },
  });

  console.log(`✅ Seeded Zones: ${northZone.code}, ${southZone.code}`);

  // 2. Seed Service Areas (PIN codes)
  const pinCodes = [
    { pinCode: "110001", name: "Connaught Place", locality: "Central", city: "New Delhi", state: "Delhi", zoneId: northZone.id },
    { pinCode: "110002", name: "Darya Ganj", locality: "Central", city: "New Delhi", state: "Delhi", zoneId: northZone.id },
    { pinCode: "110003", name: "Aliganj", locality: "South", city: "New Delhi", state: "Delhi", zoneId: northZone.id },
    { pinCode: "560001", name: "MG Road", locality: "Central", city: "Bangalore", state: "Karnataka", zoneId: southZone.id },
    { pinCode: "560002", name: "City Market", locality: "South", city: "Bangalore", state: "Karnataka", zoneId: southZone.id },
    { pinCode: "560034", name: "Koramangala", locality: "South", city: "Bangalore", state: "Karnataka", zoneId: southZone.id },
    { pinCode: "560038", name: "Indiranagar", locality: "East", city: "Bangalore", state: "Karnataka", zoneId: southZone.id },
  ];

  for (const sa of pinCodes) {
    await prisma.serviceArea.upsert({
      where: { pinCode: sa.pinCode },
      update: { zoneId: sa.zoneId },
      create: sa,
    });
  }

  console.log(`✅ Seeded ${pinCodes.length} Service Areas / PIN codes`);

  // 3. Seed Users with IDs from Supabase Auth
  await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { id: adminId },
    create: {
      id: adminId,
      email: SEED_ADMIN_EMAIL,
      name: "System Admin",
      role: UserRole.ADMIN,
      phone: "+919876543210",
      emailVerified: true,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: SEED_AGENT_EMAIL },
    update: { id: agentId },
    create: {
      id: agentId,
      email: SEED_AGENT_EMAIL,
      name: "Rajesh Kumar",
      role: UserRole.DELIVERY_AGENT,
      phone: "+919876543211",
      emailVerified: true,
    },
  });

  await prisma.deliveryAgentProfile.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      availability: AgentAvailability.AVAILABLE,
      currentZoneId: northZone.id,
      maxConcurrentOrders: 5,
      vehicleType: "Motorcycle",
      vehicleNumber: "DL-01-AB-1234",
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: SEED_CUSTOMER_EMAIL },
    update: { id: customerId },
    create: {
      id: customerId,
      email: SEED_CUSTOMER_EMAIL,
      name: "Anita Sharma",
      role: UserRole.CUSTOMER,
      phone: "+919876543212",
      emailVerified: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      customerType: CustomerType.B2C,
      defaultPickupAddress: "Flat 402, Sunshine Apts, Connaught Place",
      defaultPickupPinCode: "110001",
    },
  });

  console.log("✅ Seeded Admin, Agent, and Customer users");

  // 4. Seed Rate Cards & Weight Slabs
  const effectiveDate = new Date("2026-01-01T00:00:00Z");

  const intraB2cCard = await prisma.rateCard.upsert({
    where: {
      customerType_routeType_sourceZoneId_destinationZoneId_effectiveFrom: {
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        sourceZoneId: northZone.id,
        destinationZoneId: northZone.id,
        effectiveFrom: effectiveDate,
      },
    },
    update: {},
    create: {
      name: "Standard Intra-Zone B2C (North)",
      customerType: CustomerType.B2C,
      routeType: RouteType.INTRA_ZONE,
      sourceZoneId: northZone.id,
      destinationZoneId: northZone.id,
      effectiveFrom: effectiveDate,
      isActive: true,
      weightSlabs: {
        create: [
          { minWeight: 0.0, maxWeight: 1.0, basePrice: 50.0, perKgRate: 0.0 },
          { minWeight: 1.0, maxWeight: 5.0, basePrice: 50.0, perKgRate: 15.0 },
          { minWeight: 5.0, maxWeight: 20.0, basePrice: 110.0, perKgRate: 12.0 },
        ],
      },
    },
  });

  const interB2cCard = await prisma.rateCard.upsert({
    where: {
      customerType_routeType_sourceZoneId_destinationZoneId_effectiveFrom: {
        customerType: CustomerType.B2C,
        routeType: RouteType.INTER_ZONE,
        sourceZoneId: northZone.id,
        destinationZoneId: southZone.id,
        effectiveFrom: effectiveDate,
      },
    },
    update: {},
    create: {
      name: "Standard Inter-Zone B2C (North to South)",
      customerType: CustomerType.B2C,
      routeType: RouteType.INTER_ZONE,
      sourceZoneId: northZone.id,
      destinationZoneId: southZone.id,
      effectiveFrom: effectiveDate,
      isActive: true,
      weightSlabs: {
        create: [
          { minWeight: 0.0, maxWeight: 1.0, basePrice: 100.0, perKgRate: 0.0 },
          { minWeight: 1.0, maxWeight: 5.0, basePrice: 100.0, perKgRate: 25.0 },
          { minWeight: 5.0, maxWeight: 20.0, basePrice: 200.0, perKgRate: 20.0 },
        ],
      },
    },
  });

  const southIntraB2cCard = await prisma.rateCard.upsert({
    where: {
      customerType_routeType_sourceZoneId_destinationZoneId_effectiveFrom: {
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        sourceZoneId: southZone.id,
        destinationZoneId: southZone.id,
        effectiveFrom: effectiveDate,
      },
    },
    update: {},
    create: {
      name: "Standard Intra-Zone B2C (South)",
      customerType: CustomerType.B2C,
      routeType: RouteType.INTRA_ZONE,
      sourceZoneId: southZone.id,
      destinationZoneId: southZone.id,
      effectiveFrom: effectiveDate,
      isActive: true,
      weightSlabs: {
        create: [
          { minWeight: 0.0, maxWeight: 1.0, basePrice: 50.0, perKgRate: 0.0 },
          { minWeight: 1.0, maxWeight: 5.0, basePrice: 50.0, perKgRate: 15.0 },
          { minWeight: 5.0, maxWeight: 20.0, basePrice: 110.0, perKgRate: 12.0 },
        ],
      },
    },
  });

  console.log(`✅ Seeded Rate Cards: ${intraB2cCard.name}, ${interB2cCard.name}, ${southIntraB2cCard.name}`);

  // 5. Seed COD Surcharges
  const codSurcharges = [
    {
      routeType: RouteType.INTRA_ZONE,
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 40.0,
      effectiveFrom: effectiveDate,
      isActive: true,
    },
    {
      routeType: RouteType.INTER_ZONE,
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 2.5,
      minSurcharge: 50.0,
      maxSurcharge: 250.0,
      effectiveFrom: effectiveDate,
      isActive: true,
    },
  ];

  for (const surcharge of codSurcharges) {
    const existing = await prisma.codSurcharge.findFirst({
      where: {
        routeType: surcharge.routeType,
        surchargeType: surcharge.surchargeType,
        surchargeValue: surcharge.surchargeValue,
        minSurcharge: surcharge.minSurcharge,
        maxSurcharge: surcharge.maxSurcharge,
        effectiveFrom: surcharge.effectiveFrom,
      },
    });
    if (!existing) await prisma.codSurcharge.create({ data: surcharge });
  }

  console.log("✅ Seeded COD Surcharges");

  // 6. Seed Order Lifecycle Fixtures
  console.log("\n📦 Seeding order lifecycle fixtures...");

  // Helper function to calculate chargeable weight
  const calculateChargeableWeight = (actualWeight: number, volumetricWeight: number): number => {
    const rawMax = Math.max(actualWeight, volumetricWeight);
    return Math.ceil(rawMax * 2) / 2;
  };

  // Helper function to calculate delivery charge
  const calculateDeliveryCharge = (
    basePrice: number,
    perKgRate: number,
    minWeight: number,
    chargeableWeight: number
  ): number => {
    if (chargeableWeight <= minWeight) {
      return Math.round(basePrice * 100) / 100;
    }
    const additionalWeight = chargeableWeight - minWeight;
    const charge = basePrice + additionalWeight * perKgRate;
    return Math.round(charge * 100) / 100;
  };

  // Get rate cards with weight slabs
  const intraCard = await prisma.rateCard.findFirst({
    where: { name: "Standard Intra-Zone B2C (North)" },
    include: { weightSlabs: { orderBy: { minWeight: "asc" } } },
  });
  const interCard = await prisma.rateCard.findFirst({
    where: { name: "Standard Inter-Zone B2C (North to South)" },
    include: { weightSlabs: { orderBy: { minWeight: "asc" } } },
  });

  if (!intraCard || !interCard) {
    throw new Error("Rate cards not found");
  }

  // Get COD surcharge rules
  const intraCodRule = await prisma.codSurcharge.findFirst({
    where: { routeType: RouteType.INTRA_ZONE, isActive: true },
  });
  const interCodRule = await prisma.codSurcharge.findFirst({
    where: { routeType: RouteType.INTER_ZONE, isActive: true },
  });

  // Define order fixtures
  const orderFixtures: OrderFixture[] = [
    {
      orderNumber: "LMX-2026-001",
      status: OrderStatus.CREATED,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110002",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 0.8,
      volumetricWeight: 1.2,
      paymentType: PaymentType.PREPAID,
      description: "Created order awaiting confirmation",
    },
    {
      orderNumber: "LMX-2026-002",
      status: OrderStatus.ASSIGNED,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110003",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 2.5,
      volumetricWeight: 3.0,
      paymentType: PaymentType.COD,
      description: "Assigned order with agent",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-003",
      status: OrderStatus.PICKED_UP,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110002",
      dropPinCode: "560001",
      routeType: RouteType.INTER_ZONE,
      actualWeight: 4.0,
      volumetricWeight: 5.5,
      paymentType: PaymentType.PREPAID,
      description: "Package picked up by agent",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-004",
      status: OrderStatus.IN_TRANSIT,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110002",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 1.5,
      volumetricWeight: 2.0,
      paymentType: PaymentType.COD,
      description: "Package in transit",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-005",
      status: OrderStatus.OUT_FOR_DELIVERY,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110003",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 0.5,
      volumetricWeight: 0.8,
      paymentType: PaymentType.PREPAID,
      description: "Out for delivery",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-006",
      status: OrderStatus.DELIVERED,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110002",
      dropPinCode: "560002",
      routeType: RouteType.INTER_ZONE,
      actualWeight: 3.0,
      volumetricWeight: 4.0,
      paymentType: PaymentType.PREPAID,
      description: "Successfully delivered",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-010",
      status: OrderStatus.FAILED,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110002",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 1.0,
      volumetricWeight: 1.5,
      paymentType: PaymentType.COD,
      description: "Delivery failed - customer not available",
      failureReason: "Customer not available at delivery location",
      assignedAgentEmail: SEED_AGENT_EMAIL,
    },
    {
      orderNumber: "LMX-2026-011",
      status: OrderStatus.RESCHEDULED,
      customerEmail: SEED_CUSTOMER_EMAIL,
      pickupPinCode: "110001",
      dropPinCode: "110003",
      routeType: RouteType.INTRA_ZONE,
      actualWeight: 2.0,
      volumetricWeight: 2.5,
      paymentType: PaymentType.COD,
      description: "Rescheduled after failed attempt",
      failureReason: "Incorrect address provided",
      assignedAgentEmail: SEED_AGENT_EMAIL,
      currentAttempt: 2,
    },
  ];

  // Get service areas for PIN codes
  const serviceAreas = await prisma.serviceArea.findMany({
    where: { pinCode: { in: ["110001", "110002", "110003", "560001", "560002", "560034"] } },
  });
  const serviceAreaMap = new Map(serviceAreas.map((sa) => [sa.pinCode, sa]));

  // Seed each order fixture
  for (const fixture of orderFixtures) {
    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: fixture.orderNumber },
    });

    if (existingOrder) {
      console.log(`  ⏭️  Order ${fixture.orderNumber} already exists, skipping`);
      continue;
    }

    // Get customer and agent
    const customer = await prisma.user.findUnique({
      where: { email: fixture.customerEmail },
    });
    if (!customer) {
      throw new Error(`Customer ${fixture.customerEmail} not found`);
    }

    const pickupArea = serviceAreaMap.get(fixture.pickupPinCode);
    const dropArea = serviceAreaMap.get(fixture.dropPinCode);
    if (!pickupArea || !dropArea) {
      throw new Error(`Service area not found for PIN codes ${fixture.pickupPinCode} or ${fixture.dropPinCode}`);
    }

    // Calculate pricing
    const chargeableWeight = calculateChargeableWeight(fixture.actualWeight, fixture.volumetricWeight);
    const rateCard = fixture.routeType === RouteType.INTRA_ZONE ? intraCard : interCard;
    const codRule = fixture.routeType === RouteType.INTRA_ZONE ? intraCodRule : interCodRule;

    // Find matching weight slab
    const matchingSlab = rateCard.weightSlabs.find(
      (slab) =>
        (Number(slab.minWeight) === 0 && chargeableWeight >= 0 && chargeableWeight <= Number(slab.maxWeight)) ||
        (chargeableWeight > Number(slab.minWeight) && chargeableWeight <= Number(slab.maxWeight))
    );
    if (!matchingSlab) {
      throw new Error(`No matching weight slab for ${chargeableWeight} kg`);
    }

    const baseCharge = calculateDeliveryCharge(
      Number(matchingSlab.basePrice),
      Number(matchingSlab.perKgRate),
      Number(matchingSlab.minWeight),
      chargeableWeight
    );

    // Calculate COD surcharge
    let codSurcharge = 0;
    if (fixture.paymentType === PaymentType.COD && codRule) {
      if (codRule.surchargeType === SurchargeType.FLAT) {
        codSurcharge = Number(codRule.surchargeValue);
      } else {
        const percentageCharge = (baseCharge * Number(codRule.surchargeValue)) / 100;
        codSurcharge = Math.max(
          Number(codRule.minSurcharge || 0),
          Math.min(Number(codRule.maxSurcharge || Infinity), percentageCharge)
        );
      }
    }

    const totalCharge = Math.round((baseCharge + codSurcharge) * 100) / 100;

    // Create order with pricing snapshot and tracking events
    const order = await prisma.order.create({
      data: {
        orderNumber: fixture.orderNumber,
        customerId: customer.id,
        customerType: CustomerType.B2C,
        status: fixture.status,
        pickupAddress: `${pickupArea.name}, ${pickupArea.city}`,
        pickupPinCode: fixture.pickupPinCode,
        pickupZoneId: pickupArea.zoneId,
        dropAddress: `${dropArea.name}, ${dropArea.city}`,
        dropPinCode: fixture.dropPinCode,
        dropZoneId: dropArea.zoneId,
        routeType: fixture.routeType,
        packageLength: 20,
        packageBreadth: 15,
        packageHeight: 10,
        actualWeight: fixture.actualWeight,
        volumetricWeight: fixture.volumetricWeight,
        chargeableWeight: chargeableWeight,
        paymentType: fixture.paymentType,
        baseCharge: baseCharge,
        codSurcharge: codSurcharge,
        totalCharge: totalCharge,
        currentAttempt: fixture.currentAttempt || 1,
        createdById: adminId,
        pricingSnapshot: {
          create: {
            rateCardId: rateCard.id,
            rateCardName: rateCard.name,
            customerType: CustomerType.B2C,
            routeType: fixture.routeType,
            weightSlabId: matchingSlab.id,
            minWeight: Number(matchingSlab.minWeight),
            maxWeight: Number(matchingSlab.maxWeight),
            basePrice: Number(matchingSlab.basePrice),
            perKgRate: Number(matchingSlab.perKgRate),
            chargeableWeight: chargeableWeight,
            baseCharge: baseCharge,
            codSurchargeRuleId: codRule?.id,
            codSurchargeType: codRule?.surchargeType,
            codSurchargeValue: codRule?.surchargeValue ? Number(codRule.surchargeValue) : null,
            codSurchargeAmount: codSurcharge,
            totalCharge: totalCharge,
            snapshotData: {},
          },
        },
        trackingEvents: {
          create: {
            previousStatus: null,
            newStatus: OrderStatus.CREATED,
            actorId: customer.id,
            actorRole: UserRole.CUSTOMER,
            note: `Order created: ${fixture.description}`,
          },
        },
      },
    });

    // Create assignment and delivery attempts for orders currently assigned to an agent.
    if (
      fixture.status !== OrderStatus.CREATED &&
      fixture.status !== OrderStatus.RESCHEDULED &&
      fixture.assignedAgentEmail
    ) {
      const agent = await prisma.user.findUnique({
        where: { email: fixture.assignedAgentEmail },
        include: { deliveryAgentProfile: true },
      });
      if (!agent || !agent.deliveryAgentProfile) {
        throw new Error(`Agent ${fixture.assignedAgentEmail} not found`);
      }

      // Create agent assignment
      const assignment = await prisma.agentAssignment.create({
        data: {
          orderId: order.id,
          agentId: agent.id,
          assignedById: adminId,
          assignmentType: AssignmentType.MANUAL,
          status:
            fixture.status === OrderStatus.DELIVERED || fixture.status === OrderStatus.FAILED
              ? AssignmentStatus.COMPLETED
              : AssignmentStatus.ACTIVE,
          attemptNumber: 1,
        },
      });

      // Update agent's activeDeliveryCount for active assignments
      if (assignment.status === AssignmentStatus.ACTIVE) {
        await prisma.deliveryAgentProfile.update({
          where: { userId: agent.id },
          data: { activeDeliveryCount: { increment: 1 } },
        });
      }

      // Create delivery attempt
      const attemptStatus =
        fixture.status === OrderStatus.DELIVERED
          ? AttemptStatus.DELIVERED
          : fixture.status === OrderStatus.FAILED
          ? AttemptStatus.FAILED
          : fixture.status === OrderStatus.OUT_FOR_DELIVERY ||
            fixture.status === OrderStatus.IN_TRANSIT ||
            fixture.status === OrderStatus.PICKED_UP ||
            fixture.status === OrderStatus.ASSIGNED
          ? AttemptStatus.IN_PROGRESS
          : AttemptStatus.PENDING;

      await prisma.deliveryAttempt.create({
        data: {
          orderId: order.id,
          attemptNumber: 1,
          agentId: agent.id,
          status: attemptStatus,
          scheduledDate: new Date(),
          failureReason: fixture.failureReason,
          failedAt: fixture.status === OrderStatus.FAILED ? new Date() : null,
          completedAt: fixture.status === OrderStatus.DELIVERED ? new Date() : null,
        },
      });

      // Create additional tracking events for state transitions.
      const transitions: OrderStatus[] = [];
      transitions.push(OrderStatus.CONFIRMED);
      if (fixture.status !== OrderStatus.CONFIRMED) {
        transitions.push(OrderStatus.ASSIGNED);
        if (fixture.status !== OrderStatus.ASSIGNED) {
            transitions.push(OrderStatus.PICKED_UP);
            if (fixture.status !== OrderStatus.PICKED_UP) {
              transitions.push(OrderStatus.IN_TRANSIT);
              if (fixture.status !== OrderStatus.IN_TRANSIT) {
                transitions.push(OrderStatus.OUT_FOR_DELIVERY);
                if (fixture.status !== OrderStatus.OUT_FOR_DELIVERY) {
                  transitions.push(fixture.status);
                }
              }
            }
        }
      }

      let previousStatus: OrderStatus | null = OrderStatus.CREATED;
      for (const newStatus of transitions) {
        await prisma.orderTrackingEvent.create({
          data: {
            orderId: order.id,
            previousStatus: previousStatus,
            newStatus: newStatus,
            actorId:
              newStatus === OrderStatus.CONFIRMED
                ? customer.id
                : newStatus === OrderStatus.ASSIGNED
                ? adminId
                : agent.id,
            actorRole:
              newStatus === OrderStatus.CONFIRMED
                ? UserRole.CUSTOMER
                : newStatus === OrderStatus.ASSIGNED
                ? UserRole.ADMIN
                : UserRole.DELIVERY_AGENT,
            note: `Status transition: ${previousStatus || "null"} → ${newStatus}`,
          },
        });
        previousStatus = newStatus;
      }
    }

    // Rescheduled orders retain the failed first attempt and await reassignment.
    if (fixture.status === OrderStatus.RESCHEDULED && fixture.failureReason) {
      const agent = await prisma.user.findUnique({ where: { email: fixture.assignedAgentEmail } });
      if (!agent) throw new Error(`Agent ${fixture.assignedAgentEmail} not found`);

      await prisma.deliveryAttempt.create({
        data: {
          orderId: order.id,
          attemptNumber: 1,
          agentId: agent.id,
          status: AttemptStatus.FAILED,
          scheduledDate: new Date(),
          failureReason: fixture.failureReason,
          failedAt: new Date(),
        },
      });

      for (const [previousStatus, newStatus] of [
        [OrderStatus.CREATED, OrderStatus.CONFIRMED],
        [OrderStatus.CONFIRMED, OrderStatus.ASSIGNED],
        [OrderStatus.ASSIGNED, OrderStatus.PICKED_UP],
        [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        [OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],
        [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED],
        [OrderStatus.FAILED, OrderStatus.RESCHEDULED],
      ] as const) {
        await prisma.orderTrackingEvent.create({
          data: {
            orderId: order.id,
            previousStatus,
            newStatus,
            actorId: newStatus === OrderStatus.RESCHEDULED ? customer.id : agent.id,
            actorRole: newStatus === OrderStatus.RESCHEDULED ? UserRole.CUSTOMER : UserRole.DELIVERY_AGENT,
            note: newStatus === OrderStatus.FAILED ? `Delivery failed: ${fixture.failureReason}` : undefined,
          },
        });
      }

      // Create the pending retry attempt after rescheduling.
      await prisma.deliveryAttempt.create({
        data: {
          orderId: order.id,
          attemptNumber: 2,
          status: AttemptStatus.PENDING,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`  ✅ Created order ${fixture.orderNumber} (${fixture.status})`);
  }

  console.log("✅ Seeded Order Lifecycle Fixtures");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
