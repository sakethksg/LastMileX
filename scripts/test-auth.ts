import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const agentPassword = process.env.SEED_AGENT_PASSWORD;
const customerPassword = process.env.SEED_CUSTOMER_PASSWORD;

async function testAuth() {
  console.log("🔐 Testing Supabase Authentication Integration\n");

  const client = createClient(supabaseUrl, anonKey);

  // Test credentials
  const testUsers = [
    { email: process.env.SEED_ADMIN_EMAIL || "admin@lastmilex.com", password: adminPassword, role: "ADMIN" },
    { email: process.env.SEED_AGENT_EMAIL || "agent@lastmilex.com", password: agentPassword, role: "DELIVERY_AGENT" },
    { email: process.env.SEED_CUSTOMER_EMAIL || "customer@example.com", password: customerPassword, role: "CUSTOMER" },
  ];

  for (const testUser of testUsers) {
    console.log(`\n📋 Testing ${testUser.role} login...`);

    if (!testUser.password) {
      console.log("  ⚠️  Skipped: set the corresponding SEED_*_PASSWORD variable");
      continue;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) {
      console.log(`  ❌ Login failed: ${error.message}`);
      continue;
    }

    console.log(`  ✅ Login successful`);
    console.log(`  📧 Email: ${data.user?.email}`);
    console.log(`  🆔 ID: ${data.user?.id}`);
    console.log(`  ✉️  Email verified: ${data.user?.email_confirmed_at ? "Yes" : "No"}`);

    // Sign out
    await client.auth.signOut();
    console.log(`  🚪 Signed out`);
  }

  console.log("\n✅ Authentication test complete!");
}

testAuth().catch(console.error);
