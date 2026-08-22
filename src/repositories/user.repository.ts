import { prisma } from "@/lib/prisma";
import { UserRole, CustomerType, AgentAvailability, Prisma } from "@prisma/client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        deliveryAgentProfile: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        customerProfile: true,
        deliveryAgentProfile: true,
      },
    });
  }

  async upsertUserWithProfile(params: {
    id: string;
    email: string;
    name: string;
    role?: UserRole;
    phone?: string | null;
    emailVerified?: boolean;
    customerProfile?: {
      customerType?: CustomerType;
      companyName?: string | null;
      defaultPickupAddress?: string | null;
      defaultPickupPinCode?: string | null;
    };
    deliveryAgentProfile?: {
      availability?: AgentAvailability;
      currentZoneId?: string | null;
      maxConcurrentOrders?: number;
      vehicleType?: string | null;
      vehicleNumber?: string | null;
    };
  }) {
    const role = params.role ?? UserRole.CUSTOMER;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { id: params.id },
        create: {
          id: params.id,
          email: params.email.toLowerCase(),
          name: params.name,
          role,
          phone: params.phone ?? null,
          emailVerified: params.emailVerified ?? false,
          isActive: true,
        },
        update: {
          email: params.email.toLowerCase(),
          name: params.name,
          phone: params.phone !== undefined ? params.phone : undefined,
          emailVerified: params.emailVerified !== undefined ? params.emailVerified : undefined,
        },
      });

      if (role === UserRole.CUSTOMER) {
        await tx.customerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            customerType: params.customerProfile?.customerType ?? CustomerType.B2C,
            companyName: params.customerProfile?.companyName ?? null,
            defaultPickupAddress: params.customerProfile?.defaultPickupAddress ?? null,
            defaultPickupPinCode: params.customerProfile?.defaultPickupPinCode ?? null,
          },
          update: {
            customerType: params.customerProfile?.customerType,
            companyName: params.customerProfile?.companyName,
            defaultPickupAddress: params.customerProfile?.defaultPickupAddress,
            defaultPickupPinCode: params.customerProfile?.defaultPickupPinCode,
          },
        });
      } else if (role === UserRole.DELIVERY_AGENT) {
        await tx.deliveryAgentProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            availability: params.deliveryAgentProfile?.availability ?? AgentAvailability.OFFLINE,
            currentZoneId: params.deliveryAgentProfile?.currentZoneId ?? null,
            maxConcurrentOrders: params.deliveryAgentProfile?.maxConcurrentOrders ?? 5,
            vehicleType: params.deliveryAgentProfile?.vehicleType ?? null,
            vehicleNumber: params.deliveryAgentProfile?.vehicleNumber ?? null,
          },
          update: {
            currentZoneId: params.deliveryAgentProfile?.currentZoneId,
            maxConcurrentOrders: params.deliveryAgentProfile?.maxConcurrentOrders,
            vehicleType: params.deliveryAgentProfile?.vehicleType,
            vehicleNumber: params.deliveryAgentProfile?.vehicleNumber,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          customerProfile: true,
          deliveryAgentProfile: true,
        },
      });
    });
  }

  async updateRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  async listUsers(params?: {
    role?: UserRole;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(params?.role ? { role: params.role } : {}),
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          customerProfile: true,
          deliveryAgentProfile: true,
        },
      }),
    ]);

    return { total, users };
  }
}

export const userRepository = new UserRepository();
