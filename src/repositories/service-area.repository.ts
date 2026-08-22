import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ServiceAreaRepository {
  async findById(id: string) {
    return prisma.serviceArea.findUnique({
      where: { id },
      include: {
        zone: true,
      },
    });
  }

  async findByPinCode(pinCode: string, onlyActive = true) {
    return prisma.serviceArea.findFirst({
      where: {
        pinCode,
        ...(onlyActive ? { isActive: true, zone: { isActive: true } } : {}),
      },
      include: {
        zone: true,
      },
    });
  }

  async create(data: {
    name: string;
    pinCode: string;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    zoneId: string;
    isActive?: boolean;
  }) {
    return prisma.serviceArea.create({
      data: {
        name: data.name,
        pinCode: data.pinCode,
        locality: data.locality ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zoneId: data.zoneId,
        isActive: data.isActive ?? true,
      },
      include: {
        zone: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      pinCode?: string;
      locality?: string | null;
      city?: string | null;
      state?: string | null;
      zoneId?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.serviceArea.update({
      where: { id },
      data: {
        name: data.name,
        pinCode: data.pinCode,
        locality: data.locality !== undefined ? data.locality : undefined,
        city: data.city !== undefined ? data.city : undefined,
        state: data.state !== undefined ? data.state : undefined,
        zoneId: data.zoneId,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        zone: true,
      },
    });
  }

  async list(params?: {
    pinCode?: string;
    zoneId?: string;
    city?: string;
    state?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ServiceAreaWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.pinCode ? { pinCode: { contains: params.pinCode } } : {}),
      ...(params?.zoneId ? { zoneId: params.zoneId } : {}),
      ...(params?.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
      ...(params?.state ? { state: { contains: params.state, mode: "insensitive" } } : {}),
    };

    const [total, serviceAreas] = await Promise.all([
      prisma.serviceArea.count({ where }),
      prisma.serviceArea.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: [{ zone: { code: "asc" } }, { pinCode: "asc" }],
        include: {
          zone: true,
        },
      }),
    ]);

    return { total, serviceAreas };
  }
}

export const serviceAreaRepository = new ServiceAreaRepository();
