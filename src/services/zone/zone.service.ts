import { zoneRepository, ZoneRepository } from "@/repositories/zone.repository";
import { CreateZoneInput, UpdateZoneInput, ZoneQueryInput } from "@/schemas/zone.schema";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

export class ZoneService {
  constructor(private readonly zoneRepo: ZoneRepository = zoneRepository) {}

  async createZone(input: CreateZoneInput) {
    const existingCode = await this.zoneRepo.findByCode(input.code);
    if (existingCode) {
      throw new ConflictError(`Zone with code '${input.code.toUpperCase()}' already exists`);
    }

    const existingName = await this.zoneRepo.findByName(input.name);
    if (existingName) {
      throw new ConflictError(`Zone with name '${input.name}' already exists`);
    }

    return this.zoneRepo.create(input);
  }

  async updateZone(id: string, input: UpdateZoneInput) {
    const existing = await this.zoneRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Zone with ID '${id}' not found`);
    }

    if (input.code && input.code.toUpperCase() !== existing.code) {
      const codeConflict = await this.zoneRepo.findByCode(input.code);
      if (codeConflict) {
        throw new ConflictError(`Zone with code '${input.code.toUpperCase()}' already exists`);
      }
    }

    if (input.name && input.name !== existing.name) {
      const nameConflict = await this.zoneRepo.findByName(input.name);
      if (nameConflict) {
        throw new ConflictError(`Zone with name '${input.name}' already exists`);
      }
    }

    return this.zoneRepo.update(id, input);
  }

  async getZoneById(id: string) {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) {
      throw new NotFoundError(`Zone with ID '${id}' not found`);
    }
    return zone;
  }

  async listZones(query?: ZoneQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, zones } = await this.zoneRepo.list({
      search: query?.search,
      isActive: query?.isActive,
      skip,
      take: limit,
    });

    return {
      zones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async toggleZoneActive(id: string, isActive: boolean) {
    await this.getZoneById(id);
    return this.zoneRepo.update(id, { isActive });
  }
}

export const zoneService = new ZoneService();
