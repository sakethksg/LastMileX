import { codSurchargeRepository, CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import {
  CreateCodSurchargeInput,
  UpdateCodSurchargeInput,
  CodSurchargeQueryInput,
} from "@/schemas/cod-surcharge.schema";
import { SurchargeType } from "@/types/enums";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

export class CodSurchargeService {
  constructor(private readonly codRepo: CodSurchargeRepository = codSurchargeRepository) {}

  async createCodSurcharge(input: CreateCodSurchargeInput) {
    if (input.surchargeType === SurchargeType.PERCENTAGE) {
      if (input.surchargeValue <= 0 || input.surchargeValue > 100) {
        throw new ValidationError("Percentage surcharge value must be between 0 and 100%");
      }
    }

    if (
      input.minSurcharge !== undefined &&
      input.minSurcharge !== null &&
      input.maxSurcharge !== undefined &&
      input.maxSurcharge !== null &&
      input.maxSurcharge < input.minSurcharge
    ) {
      throw new ValidationError("maxSurcharge cannot be less than minSurcharge");
    }

    return this.codRepo.create(input);
  }

  async updateCodSurcharge(id: string, input: UpdateCodSurchargeInput) {
    const existing = await this.codRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`COD surcharge rule with ID '${id}' not found`);
    }

    return this.codRepo.update(id, input);
  }

  async getCodSurchargeById(id: string) {
    const rule = await this.codRepo.findById(id);
    if (!rule) {
      throw new NotFoundError(`COD surcharge rule with ID '${id}' not found`);
    }
    return rule;
  }

  async listCodSurcharges(query?: CodSurchargeQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, codSurcharges } = await this.codRepo.list({
      routeType: query?.routeType,
      surchargeType: query?.surchargeType,
      isActive: query?.isActive,
      skip,
      take: limit,
    });

    return {
      codSurcharges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async toggleCodSurchargeActive(id: string, isActive: boolean) {
    await this.getCodSurchargeById(id);
    return this.codRepo.update(id, { isActive });
  }
}

export const codSurchargeService = new CodSurchargeService();
