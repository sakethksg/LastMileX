import { PrismaClient, UserRole, CustomerType, AgentAvailability, RouteType, SurchargeType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

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
  ];

  for (const sa of pinCodes) {
    await prisma.serviceArea.upsert({
      where: { pinCode: sa.pinCode },
      update: { zoneId: sa.zoneId },
      create: sa,
    });
  }

  console.log(`✅ Seeded ${pinCodes.length} Service Areas / PIN codes`);

  // 3. Seed Users
  const adminId = "00000000-0000-0000-0000-000000000001";
  const agentId = "00000000-0000-0000-0000-000000000002";
  const customerId = "00000000-0000-0000-0000-000000000003";

  await prisma.user.upsert({
    where: { id: adminId },
    update: {},
    create: {
      id: adminId,
      email: "admin@lastmilex.com",
      name: "System Admin",
      role: UserRole.ADMIN,
      phone: "+919876543210",
      emailVerified: true,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { id: agentId },
    update: {},
    create: {
      id: agentId,
      email: "agent@lastmilex.com",
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
    where: { id: customerId },
    update: {},
    create: {
      id: customerId,
      email: "customer@example.com",
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

  console.log(`✅ Seeded Rate Cards: ${intraB2cCard.name}, ${interB2cCard.name}`);

  // 5. Seed COD Surcharges
  await prisma.codSurcharge.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeded COD Surcharges");
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
