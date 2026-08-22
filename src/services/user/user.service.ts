import { userRepository, UserRepository } from "@/repositories/user.repository";
import { UserRole, CustomerType, AgentAvailability } from "@/types/enums";
import { SyncUserInput, UpdateProfileInput } from "@/schemas/auth.schema";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

export class UserService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async syncSupabaseUser(input: SyncUserInput) {
    return this.userRepo.upsertUserWithProfile({
      id: input.id,
      email: input.email,
      name: input.name,
      role: input.role,
      phone: input.phone,
      emailVerified: input.emailVerified,
      customerProfile:
        input.role === UserRole.CUSTOMER
          ? {
              customerType: input.customerType ?? CustomerType.B2C,
              companyName: input.companyName,
              defaultPickupAddress: input.defaultPickupAddress,
              defaultPickupPinCode: input.defaultPickupPinCode,
            }
          : undefined,
      deliveryAgentProfile:
        input.role === UserRole.DELIVERY_AGENT
          ? {
              availability: input.agentAvailability ?? AgentAvailability.OFFLINE,
              currentZoneId: input.currentZoneId,
              maxConcurrentOrders: input.maxConcurrentOrders ?? 5,
            }
          : undefined,
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError(`User with email ${email} not found`);
    }
    return user;
  }

  async updateUserRole(id: string, newRole: UserRole) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return this.userRepo.updateRole(id, newRole);
  }

  async setUserActiveStatus(id: string, isActive: boolean) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return this.userRepo.updateActiveStatus(id, isActive);
  }
}

export const userService = new UserService();
