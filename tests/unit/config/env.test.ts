import { describe, it, expect } from "vitest";
import { getValidatedEnv } from "@/config/env";

describe("Environment Validation", () => {
  it("validates correct environment configuration", () => {
    const validEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sample-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "sample-service-role-key",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/lastmilex",
      DIRECT_URL: "postgresql://postgres:password@localhost:5432/lastmilex",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    };

    const validated = getValidatedEnv(validEnv);
    expect(validated.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(validated.NODE_ENV).toBe("test");
  });

  it("throws error if required environment variables are missing or invalid", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "not-a-valid-url",
    };

    expect(() => getValidatedEnv(invalidEnv as Record<string, string | undefined>)).toThrowError(
      /Environment validation failed/
    );
  });
});
