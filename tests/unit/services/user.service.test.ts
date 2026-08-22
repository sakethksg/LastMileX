import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user/user.service";
import { UserRepository } from "@/repositories/user.repository";
import { UserRole, CustomerType, AgentAvailability } from "@/types/enums";
import { NotFoundError } from "@/lib/errors/app-error";

describe("UserService", () => {
  let mockUserRepo: UserRepository;
  let userService: UserService;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      upsertUserWithProfile: vi.fn(),
      updateRole: vi.fn(),
      updateActiveStatus: vi.fn(),
      listUsers: vi.fn(),
    } as unknown as UserRepository;

    userService = new UserService(mockUserRepo);
  });

  describe("syncSupabaseUser", () => {
    it("provisions a CUSTOMER user with customer profile", async () => {
      const syncInput = {
        id: "11111111-1111-1111-1111-111111111111",
        email: "customer@example.com",
        name: "Anita Sharma",
        role: UserRole.CUSTOMER,
        customerType: CustomerType.B2C,
        defaultPickupAddress: "Connaught Place",
        defaultPickupPinCode: "110001",
        emailVerified: true,
      };

      const expectedResult = {
        ...syncInput,
        isActive: true,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerProfile: {
          id: "cp-1",
          userId: syncInput.id,
          customerType: CustomerType.B2C,
          companyName: null,
          defaultPickupAddress: "Connaught Place",
          defaultPickupPinCode: "110001",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        deliveryAgentProfile: null,
      };

      vi.mocked(mockUserRepo.upsertUserWithProfile).mockResolvedValue(expectedResult as any);

      const result = await userService.syncSupabaseUser(syncInput);

      expect(mockUserRepo.upsertUserWithProfile).toHaveBeenCalledWith({
        id: syncInput.id,
        email: syncInput.email,
        name: syncInput.name,
        role: UserRole.CUSTOMER,
        phone: undefined,
        emailVerified: true,
        customerProfile: {
          customerType: CustomerType.B2C,
          companyName: undefined,
          defaultPickupAddress: "Connaught Place",
          defaultPickupPinCode: "110001",
        },
        deliveryAgentProfile: undefined,
      });

      expect(result.role).toBe(UserRole.CUSTOMER);
      expect(result.customerProfile?.defaultPickupPinCode).toBe("110001");
    });

    it("provisions a DELIVERY_AGENT user with agent profile", async () => {
      const syncInput = {
        id: "22222222-2222-2222-2222-222222222222",
        email: "agent@lastmilex.com",
        name: "Rajesh Kumar",
        role: UserRole.DELIVERY_AGENT,
        agentAvailability: AgentAvailability.AVAILABLE,
        maxConcurrentOrders: 6,
        emailVerified: false,
      };

      const expectedResult = {
        ...syncInput,
        isActive: true,
        phone: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerProfile: null,
        deliveryAgentProfile: {
          id: "ap-1",
          userId: syncInput.id,
          availability: AgentAvailability.AVAILABLE,
          currentZoneId: null,
          maxConcurrentOrders: 6,
          vehicleType: null,
          vehicleNumber: null,
          activeDeliveryCount: 0,
          lastKnownLatitude: null,
          lastKnownLongitude: null,
          lastLocationUpdateAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(mockUserRepo.upsertUserWithProfile).mockResolvedValue(expectedResult as any);

      const result = await userService.syncSupabaseUser(syncInput);

      expect(mockUserRepo.upsertUserWithProfile).toHaveBeenCalledWith({
        id: syncInput.id,
        email: syncInput.email,
        name: syncInput.name,
        role: UserRole.DELIVERY_AGENT,
        phone: undefined,
        emailVerified: false,
        customerProfile: undefined,
        deliveryAgentProfile: {
          availability: AgentAvailability.AVAILABLE,
          currentZoneId: undefined,
          maxConcurrentOrders: 6,
        },
      });

      expect(result.role).toBe(UserRole.DELIVERY_AGENT);
      expect(result.deliveryAgentProfile?.maxConcurrentOrders).toBe(6);
    });
  });

  describe("getUserById & getUserByEmail", () => {
    it("returns user when found", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: UserRole.CUSTOMER,
        isActive: true,
      };

      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser as any);

      const result = await userService.getUserById("user-1");
      expect(result.id).toBe("user-1");
    });

    it("throws NotFoundError when user does not exist", async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue(null);

      await expect(userService.getUserById("non-existent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateUserRole & setUserActiveStatus", () => {
    it("updates role for existing user", async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(mockUserRepo.updateRole).mockResolvedValue({ id: "user-1", role: UserRole.ADMIN } as any);

      const result = await userService.updateUserRole("user-1", UserRole.ADMIN);
      expect(mockUserRepo.updateRole).toHaveBeenCalledWith("user-1", UserRole.ADMIN);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it("updates active status for existing user", async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(mockUserRepo.updateActiveStatus).mockResolvedValue({ id: "user-1", isActive: false } as any);

      const result = await userService.setUserActiveStatus("user-1", false);
      expect(mockUserRepo.updateActiveStatus).toHaveBeenCalledWith("user-1", false);
      expect(result.isActive).toBe(false);
    });
  });
});
