import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ZoneRepository {
  async findById(id: string) {
    return prisma.zone.findUnique({
      where: { id },
      include: {
        serviceAreas: {
          where: { isActive: true },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.zone.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async findByName(name: string) {
    return prisma.zone.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; code: string; description?: string | null; isActive?: boolean }) {
    return prisma.zone.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; code?: string; description?: string | null; isActive?: boolean }
  ) {
    return prisma.zone.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });
  }

  async list(params?: { search?: string; isActive?: boolean; skip?: number; take?: number }) {
    const where: Prisma.ZoneWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { code: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, zones] = await Promise.all([
      prisma.zone.count({ where }),
      prisma.zone.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { code: "asc" },
        include: {
          _count: {
            select: { serviceAreas: true },
          },
        },
      }),
    ]);

    return { total, zones };
  }
}

export const zoneRepository = new ZoneRepository();
