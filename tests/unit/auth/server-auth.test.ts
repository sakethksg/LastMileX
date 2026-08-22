import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser, requireAuth, requireRole, requireAnyRole } from "@/lib/auth/server-auth";
import { userRepository } from "@/repositories/user.repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/enums";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors/app-error";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findById: vi.fn(),
    upsertUserWithProfile: vi.fn(),
  },
}));

describe("Server-side Auth & Privilege Escalation Prevention", () => {
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn();
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any);
  });

  describe("Privilege Escalation Prevention in Lazy Provisioning", () => {
    it("provisions user strictly as CUSTOMER even if user_metadata has role: 'ADMIN'", async () => {
      const maliciousAuthUser = {
        id: "attacker-uuid-1234",
        email: "attacker@example.com",
        email_confirmed_at: "2026-08-22T00:00:00Z",
        user_metadata: {
          name: "Attacker",
          role: "ADMIN", // Malicious metadata payload attempting privilege escalation
          is_admin: true,
        },
      };

      mockGetUser.mockResolvedValue({
        data: { user: maliciousAuthUser },
        error: null,
      });

      // App user does not exist yet in database
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      // Upsert mock returning newly provisioned user
      vi.mocked(userRepository.upsertUserWithProfile).mockResolvedValue({
        id: "attacker-uuid-1234",
        email: "attacker@example.com",
        name: "Attacker",
        role: UserRole.CUSTOMER, // Must be strictly CUSTOMER
        isActive: true,
      } as any);

      const currentUser = await getCurrentUser();

      // Verify that upsertUserWithProfile was called with role = CUSTOMER, ignoring user_metadata.role
      expect(userRepository.upsertUserWithProfile).toHaveBeenCalledWith({
        id: "attacker-uuid-1234",
        email: "attacker@example.com",
        name: "Attacker",
        role: UserRole.CUSTOMER,
        emailVerified: true,
        customerProfile: {
          customerType: "B2C",
        },
      });

      expect(currentUser).not.toBeNull();
      expect(currentUser?.role).toBe(UserRole.CUSTOMER);
      expect(currentUser?.role).not.toBe(UserRole.ADMIN);
    });

    it("provisions user strictly as CUSTOMER even if user_metadata has role: 'DELIVERY_AGENT'", async () => {
      const authUser = {
        id: "agent-attempt-uuid",
        email: "agent-claim@example.com",
        email_confirmed_at: "2026-08-22T00:00:00Z",
        user_metadata: {
          name: "Agent Claimant",
          role: "DELIVERY_AGENT",
        },
      };

      mockGetUser.mockResolvedValue({
        data: { user: authUser },
        error: null,
      });

      vi.mocked(userRepository.findById).mockResolvedValue(null);
      vi.mocked(userRepository.upsertUserWithProfile).mockResolvedValue({
        id: "agent-attempt-uuid",
        email: "agent-claim@example.com",
        name: "Agent Claimant",
        role: UserRole.CUSTOMER,
        isActive: true,
      } as any);

      const currentUser = await getCurrentUser();

      expect(userRepository.upsertUserWithProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CUSTOMER,
        })
      );

      expect(currentUser?.role).toBe(UserRole.CUSTOMER);
    });
  });

  describe("Server-side Role Gate Enforcement", () => {
    it("allows user with trusted ADMIN role in database to pass requireRole(ADMIN)", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "admin-uuid", email: "admin@lastmilex.com" },
        },
        error: null,
      });

      vi.mocked(userRepository.findById).mockResolvedValue({
        id: "admin-uuid",
        email: "admin@lastmilex.com",
        name: "Trusted Admin",
        role: UserRole.ADMIN, // Trusted role in database
        isActive: true,
      } as any);

      const user = await requireRole(UserRole.ADMIN);
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it("rejects CUSTOMER user when ADMIN role is required", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "customer-uuid", email: "customer@example.com" },
        },
        error: null,
      });

      vi.mocked(userRepository.findById).mockResolvedValue({
        id: "customer-uuid",
        email: "customer@example.com",
        name: "Customer",
        role: UserRole.CUSTOMER,
        isActive: true,
      } as any);

      await expect(requireRole(UserRole.ADMIN)).rejects.toThrow(ForbiddenError);
    });

    it("throws UnauthorizedError when session is missing or invalid", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error("No session"),
      });

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
    });
  });
});
