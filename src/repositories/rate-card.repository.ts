import { prisma } from "@/lib/prisma";
import { CustomerType, RouteType, Prisma } from "@prisma/client";
import { WeightSlabInput } from "@/schemas/rate-card.schema";

export class RateCardRepository {
  async findById(id: string) {
    return prisma.rateCard.findUnique({
      where: { id },
      include: {
        sourceZone: true,
        destinationZone: true,
        weightSlabs: {
          orderBy: { minWeight: "asc" },
        },
      },
    });
  }

  async createWithSlabs(
    data: {
      name: string;
      customerType: CustomerType;
      routeType: RouteType;
      sourceZoneId?: string | null;
      destinationZoneId?: string | null;
      effectiveFrom: Date;
      effectiveTo?: Date | null;
      isActive?: boolean;
    },
    slabs: WeightSlabInput[]
  ) {
    return prisma.$transaction(async (tx) => {
      const rateCard = await tx.rateCard.create({
        data: {
          name: data.name,
          customerType: data.customerType,
          routeType: data.routeType,
          sourceZoneId: data.sourceZoneId ?? null,
          destinationZoneId: data.destinationZoneId ?? null,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo ?? null,
          isActive: data.isActive ?? true,
          weightSlabs: {
            create: slabs.map((s) => ({
              minWeight: s.minWeight,
              maxWeight: s.maxWeight,
              basePrice: s.basePrice,
              perKgRate: s.perKgRate ?? 0,
            })),
          },
        },
        include: {
          sourceZone: true,
          destinationZone: true,
          weightSlabs: {
            orderBy: { minWeight: "asc" },
          },
        },
      });

      return rateCard;
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      effectiveTo?: Date | null;
      isActive?: boolean;
    }
  ) {
    return prisma.rateCard.update({
      where: { id },
      data: {
        name: data.name,
        effectiveTo: data.effectiveTo !== undefined ? data.effectiveTo : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        sourceZone: true,
        destinationZone: true,
        weightSlabs: {
          orderBy: { minWeight: "asc" },
        },
      },
    });
  }

  async list(params?: {
    customerType?: CustomerType;
    routeType?: RouteType;
    sourceZoneId?: string;
    destinationZoneId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.RateCardWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.customerType ? { customerType: params.customerType } : {}),
      ...(params?.routeType ? { routeType: params.routeType } : {}),
      ...(params?.sourceZoneId ? { sourceZoneId: params.sourceZoneId } : {}),
      ...(params?.destinationZoneId ? { destinationZoneId: params.destinationZoneId } : {}),
    };

    const [total, rateCards] = await Promise.all([
      prisma.rateCard.count({ where }),
      prisma.rateCard.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        include: {
          sourceZone: true,
          destinationZone: true,
          weightSlabs: {
            orderBy: { minWeight: "asc" },
          },
        },
      }),
    ]);

    return { total, rateCards };
  }

  async findApplicableRateCard(params: {
    customerType: CustomerType;
    routeType: RouteType;
    sourceZoneId?: string | null;
    destinationZoneId?: string | null;
    date?: Date;
  }) {
    const targetDate = params.date ?? new Date();

    if (params.routeType === RouteType.INTRA_ZONE) {
      // 1. Check zone-specific intra-zone card first, then global fallback
      return prisma.rateCard.findFirst({
        where: {
          customerType: params.customerType,
          routeType: RouteType.INTRA_ZONE,
          isActive: true,
          effectiveFrom: { lte: targetDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: targetDate } }],
          AND: [
            {
              OR: [
                { sourceZoneId: params.sourceZoneId },
                { sourceZoneId: null },
              ],
            },
          ],
        },
        orderBy: [{ sourceZoneId: "desc" }, { effectiveFrom: "desc" }],
        include: {
          weightSlabs: {
            orderBy: { minWeight: "asc" },
          },
        },
      });
    }

    // 2. Inter-zone: specific zone-pair first, then global fallback
    return prisma.rateCard.findFirst({
      where: {
        customerType: params.customerType,
        routeType: RouteType.INTER_ZONE,
        isActive: true,
        effectiveFrom: { lte: targetDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: targetDate } }],
        AND: [
          {
            OR: [
              {
                sourceZoneId: params.sourceZoneId,
                destinationZoneId: params.destinationZoneId,
              },
              {
                sourceZoneId: null,
                destinationZoneId: null,
              },
            ],
          },
        ],
      },
      orderBy: [{ sourceZoneId: "desc" }, { effectiveFrom: "desc" }],
      include: {
        weightSlabs: {
          orderBy: { minWeight: "asc" },
        },
      },
    });
  }
}

export const rateCardRepository = new RateCardRepository();
