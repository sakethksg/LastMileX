import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, syncUserSchema } from "@/schemas/auth.schema";
import { UserRole, CustomerType, AgentAvailability } from "@/types/enums";

describe("Auth Validation Schemas", () => {
  describe("Register Schema", () => {
    it("validates valid registration payload", () => {
      const valid = {
        email: "customer@example.com",
        password: "securePassword123",
        name: "John Doe",
        phone: "+919876543210",
        customerType: CustomerType.B2C,
        defaultPickupPinCode: "110001",
      };

      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email address", () => {
      const invalid = {
        email: "not-an-email",
        password: "securePassword123",
        name: "John Doe",
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("rejects password shorter than 8 characters", () => {
      const invalid = {
        email: "customer@example.com",
        password: "short",
        name: "John Doe",
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("rejects invalid 6-digit PIN code", () => {
      const invalid = {
        email: "customer@example.com",
        password: "securePassword123",
        name: "John Doe",
        defaultPickupPinCode: "1234", // Not 6 digits
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Login Schema", () => {
    it("validates valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Sync User Schema", () => {
    it("validates full customer sync payload", () => {
      const valid = {
        id: "11111111-1111-1111-1111-111111111111",
        email: "customer@example.com",
        name: "Anita Sharma",
        role: UserRole.CUSTOMER,
        customerType: CustomerType.B2B,
        companyName: "Acme Logistics Ltd",
      };

      const result = syncUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates delivery agent sync payload", () => {
      const valid = {
        id: "22222222-2222-2222-2222-222222222222",
        email: "agent@lastmilex.com",
        name: "Rajesh Kumar",
        role: UserRole.DELIVERY_AGENT,
        agentAvailability: AgentAvailability.AVAILABLE,
        maxConcurrentOrders: 8,
      };

      const result = syncUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
