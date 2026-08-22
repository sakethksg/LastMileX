import { serviceAreaRepository, ServiceAreaRepository } from "@/repositories/service-area.repository";
import { zoneRepository, ZoneRepository } from "@/repositories/zone.repository";
import {
  CreateServiceAreaInput,
  UpdateServiceAreaInput,
  ServiceAreaQueryInput,
} from "@/schemas/service-area.schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

export class ServiceAreaService {
  constructor(
    private readonly serviceAreaRepo: ServiceAreaRepository = serviceAreaRepository,
    private readonly zoneRepo: ZoneRepository = zoneRepository
  ) {}

  async createServiceArea(input: CreateServiceAreaInput) {
    const zone = await this.zoneRepo.findById(input.zoneId);
    if (!zone) {
      throw new NotFoundError(`Zone with ID '${input.zoneId}' does not exist`);
    }
    if (!zone.isActive) {
      throw new ValidationError(`Cannot assign service area to inactive zone '${zone.name}'`);
    }

    const existingPin = await this.serviceAreaRepo.findByPinCode(input.pinCode, false);
    if (existingPin) {
      throw new ConflictError(`Service area with PIN code '${input.pinCode}' already exists`);
    }

    return this.serviceAreaRepo.create(input);
  }

  async updateServiceArea(id: string, input: UpdateServiceAreaInput) {
    const existing = await this.serviceAreaRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Service area with ID '${id}' not found`);
    }

    if (input.zoneId && input.zoneId !== existing.zoneId) {
      const zone = await this.zoneRepo.findById(input.zoneId);
      if (!zone) {
        throw new NotFoundError(`Zone with ID '${input.zoneId}' does not exist`);
      }
      if (!zone.isActive) {
        throw new ValidationError(`Cannot assign service area to inactive zone '${zone.name}'`);
      }
    }

    if (input.pinCode && input.pinCode !== existing.pinCode) {
      const pinConflict = await this.serviceAreaRepo.findByPinCode(input.pinCode, false);
      if (pinConflict) {
        throw new ConflictError(`Service area with PIN code '${input.pinCode}' already exists`);
      }
    }

    return this.serviceAreaRepo.update(id, input);
  }

  async getServiceAreaById(id: string) {
    const area = await this.serviceAreaRepo.findById(id);
    if (!area) {
      throw new NotFoundError(`Service area with ID '${id}' not found`);
    }
    return area;
  }

  async resolveZoneByPinCode(pinCode: string) {
    const area = await this.serviceAreaRepo.findByPinCode(pinCode, true);
    if (!area || !area.zone || !area.zone.isActive) {
      return null;
    }
    return {
      serviceArea: area,
      zone: area.zone,
    };
  }

  async listServiceAreas(query?: ServiceAreaQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, serviceAreas } = await this.serviceAreaRepo.list({
      pinCode: query?.pinCode,
      zoneId: query?.zoneId,
      city: query?.city,
      state: query?.state,
      isActive: query?.isActive,
      skip,
      take: limit,
    });

    return {
      serviceAreas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async toggleServiceAreaActive(id: string, isActive: boolean) {
    await this.getServiceAreaById(id);
    return this.serviceAreaRepo.update(id, { isActive });
  }
}

export const serviceAreaService = new ServiceAreaService();
