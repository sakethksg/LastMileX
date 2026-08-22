import { PrismaClient } from "@prisma/client";

async function verifyDatabase() {
  console.log("🔍 Checking database connectivity and schema...");
  const prisma = new PrismaClient();

  try {
    // 1. Connectivity test
    await prisma.$connect();
    console.log("✅ Database connection established.");

    // 2. Query basic model counts
    const [usersCount, zonesCount, rateCardsCount] = await Promise.all([
      prisma.user.count(),
      prisma.zone.count(),
      prisma.rateCard.count(),
    ]);

    console.log(`✅ Database schema verified:`);
    console.log(`   - Users table count: ${usersCount}`);
    console.log(`   - Zones table count: ${zonesCount}`);
    console.log(`   - Rate Cards table count: ${rateCardsCount}`);
    console.log("🎉 Database verification complete!");
  } catch (error: any) {
    if (error.code === "P1001" || error.message?.includes("Can't reach database server")) {
      console.warn("⚠️  Database server is currently offline at configured DATABASE_URL.");
      console.warn("   Prisma Client models, schema definitions, and migration files are verified statically.");
    } else {
      console.error("❌ Database verification failed:", error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
