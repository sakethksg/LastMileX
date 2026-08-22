import { rateCardRepository, RateCardRepository } from "@/repositories/rate-card.repository";
import { zoneRepository, ZoneRepository } from "@/repositories/zone.repository";
import {
  CreateRateCardInput,
  UpdateRateCardInput,
  RateCardQueryInput,
  WeightSlabInput,
} from "@/schemas/rate-card.schema";
import { RouteType } from "@/types/enums";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

export class RateCardService {
  constructor(
    private readonly rateCardRepo: RateCardRepository = rateCardRepository,
    private readonly zoneRepo: ZoneRepository = zoneRepository
  ) {}

  validateWeightSlabs(slabs: WeightSlabInput[]): void {
    if (!slabs || slabs.length === 0) {
      throw new ValidationError("Rate card must contain at least one weight slab");
    }

    // Sort slabs ascending by minWeight
    const sorted = [...slabs].sort((a, b) => a.minWeight - b.minWeight);

    // Enforce first slab starts at 0
    if (sorted[0].minWeight !== 0) {
      throw new ValidationError(`First weight slab must start at minWeight 0, but starts at ${sorted[0].minWeight}`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      if (current.minWeight < 0) {
        throw new ValidationError(`minWeight must be non-negative: ${current.minWeight}`);
      }
      if (current.maxWeight <= current.minWeight) {
        throw new ValidationError(
          `maxWeight (${current.maxWeight}) must be strictly greater than minWeight (${current.minWeight})`
        );
      }
      if (current.basePrice < 0) {
        throw new ValidationError(`basePrice must be non-negative: ${current.basePrice}`);
      }
      if ((current.perKgRate ?? 0) < 0) {
        throw new ValidationError(`perKgRate must be non-negative: ${current.perKgRate}`);
      }

      // Check contiguous boundary with previous slab (no overlap, no gap)
      if (i > 0) {
        const previous = sorted[i - 1];
        if (current.minWeight < previous.maxWeight) {
          throw new ValidationError(
            `Overlapping weight slabs detected: slab [${previous.minWeight} - ${previous.maxWeight}] overlaps with [${current.minWeight} - ${current.maxWeight}]`
          );
        }
        if (current.minWeight > previous.maxWeight) {
          throw new ValidationError(
            `Gap in weight slabs detected between [${previous.minWeight} - ${previous.maxWeight}] and [${current.minWeight} - ${current.maxWeight}]`
          );
        }
      }
    }
  }

  async createRateCard(input: CreateRateCardInput) {
    // 1. Validate Weight Slabs
    this.validateWeightSlabs(input.weightSlabs);

    // 2. Validate Zone references
    if (input.sourceZoneId) {
      const sourceZone = await this.zoneRepo.findById(input.sourceZoneId);
      if (!sourceZone) {
        throw new NotFoundError(`Source zone with ID '${input.sourceZoneId}' not found`);
      }
    }

    if (input.destinationZoneId) {
      const destZone = await this.zoneRepo.findById(input.destinationZoneId);
      if (!destZone) {
        throw new NotFoundError(`Destination zone with ID '${input.destinationZoneId}' not found`);
      }
    }

    // 3. Validate Route Type vs Zones
    if (input.routeType === RouteType.INTRA_ZONE) {
      if (
        input.sourceZoneId &&
        input.destinationZoneId &&
        input.sourceZoneId !== input.destinationZoneId
      ) {
        throw new ValidationError("For INTRA_ZONE rate cards, destinationZoneId must match sourceZoneId or be null");
      }
    } else if (input.routeType === RouteType.INTER_ZONE) {
      if (
        input.sourceZoneId &&
        input.destinationZoneId &&
        input.sourceZoneId === input.destinationZoneId
      ) {
        throw new ValidationError("For INTER_ZONE rate cards, source and destination zones must be distinct");
      }
    }

    return this.rateCardRepo.createWithSlabs(input, input.weightSlabs);
  }

  async updateRateCard(id: string, input: UpdateRateCardInput) {
    const existing = await this.rateCardRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Rate card with ID '${id}' not found`);
    }

    return this.rateCardRepo.update(id, input);
  }

  async getRateCardById(id: string) {
    const rateCard = await this.rateCardRepo.findById(id);
    if (!rateCard) {
      throw new NotFoundError(`Rate card with ID '${id}' not found`);
    }
    return rateCard;
  }

  async listRateCards(query?: RateCardQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, rateCards } = await this.rateCardRepo.list({
      customerType: query?.customerType,
      routeType: query?.routeType,
      sourceZoneId: query?.sourceZoneId,
      destinationZoneId: query?.destinationZoneId,
      isActive: query?.isActive,
      skip,
      take: limit,
    });

    return {
      rateCards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async toggleRateCardActive(id: string, isActive: boolean) {
    await this.getRateCardById(id);
    return this.rateCardRepo.update(id, { isActive });
  }
}

export const rateCardService = new RateCardService();
