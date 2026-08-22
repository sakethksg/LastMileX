import { prisma } from "@/lib/prisma";
import { RouteType, SurchargeType, Prisma } from "@prisma/client";

export class CodSurchargeRepository {
  async findById(id: string) {
    return prisma.codSurcharge.findUnique({
      where: { id },
    });
  }

  async create(data: {
    routeType: RouteType;
    surchargeType: SurchargeType;
    surchargeValue: number;
    minSurcharge?: number | null;
    maxSurcharge?: number | null;
    effectiveFrom: Date;
    effectiveTo?: Date | null;
    isActive?: boolean;
  }) {
    return prisma.codSurcharge.create({
      data: {
        routeType: data.routeType,
        surchargeType: data.surchargeType,
        surchargeValue: data.surchargeValue,
        minSurcharge: data.minSurcharge ?? null,
        maxSurcharge: data.maxSurcharge ?? null,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      effectiveTo?: Date | null;
      isActive?: boolean;
    }
  ) {
    return prisma.codSurcharge.update({
      where: { id },
      data: {
        effectiveTo: data.effectiveTo !== undefined ? data.effectiveTo : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });
  }

  async list(params?: {
    routeType?: RouteType;
    surchargeType?: SurchargeType;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.CodSurchargeWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.routeType ? { routeType: params.routeType } : {}),
      ...(params?.surchargeType ? { surchargeType: params.surchargeType } : {}),
    };

    const [total, codSurcharges] = await Promise.all([
      prisma.codSurcharge.count({ where }),
      prisma.codSurcharge.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    return { total, codSurcharges };
  }

  async findActiveRule(routeType: RouteType, date = new Date()) {
    return prisma.codSurcharge.findFirst({
      where: {
        routeType,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: date } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }
}

export const codSurchargeRepository = new CodSurchargeRepository();
