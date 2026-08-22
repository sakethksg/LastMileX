import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceAreaService } from "@/services/service-area/service-area.service";
import { ServiceAreaRepository } from "@/repositories/service-area.repository";
import { ZoneRepository } from "@/repositories/zone.repository";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

describe("ServiceAreaService", () => {
  let serviceAreaService: ServiceAreaService;
  let mockServiceAreaRepo: {
    findById: ReturnType<typeof vi.fn>;
    findByPinCode: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  let mockZoneRepo: {
    findById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockServiceAreaRepo = {
      findById: vi.fn(),
      findByPinCode: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
    };
    mockZoneRepo = {
      findById: vi.fn(),
    };
    serviceAreaService = new ServiceAreaService(
      mockServiceAreaRepo as unknown as ServiceAreaRepository,
      mockZoneRepo as unknown as ZoneRepository
    );
  });

  it("creates a service area linked to an active zone", async () => {
    mockZoneRepo.findById.mockResolvedValue({ id: "zone-1", name: "North Zone", isActive: true });
    mockServiceAreaRepo.findByPinCode.mockResolvedValue(null);
    mockServiceAreaRepo.create.mockResolvedValue({
      id: "sa-1",
      name: "Connaught Place",
      pinCode: "110001",
      zoneId: "zone-1",
      isActive: true,
    });

    const result = await serviceAreaService.createServiceArea({
      name: "Connaught Place",
      pinCode: "110001",
      zoneId: "zone-1",
    });

    expect(result.pinCode).toBe("110001");
  });

  it("throws ValidationError when assigning service area to inactive zone", async () => {
    mockZoneRepo.findById.mockResolvedValue({ id: "zone-1", name: "North Zone", isActive: false });

    await expect(
      serviceAreaService.createServiceArea({
        name: "Connaught Place",
        pinCode: "110001",
        zoneId: "zone-1",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ConflictError when PIN code is already registered", async () => {
    mockZoneRepo.findById.mockResolvedValue({ id: "zone-1", name: "North Zone", isActive: true });
    mockServiceAreaRepo.findByPinCode.mockResolvedValue({ id: "sa-existing", pinCode: "110001" });

    await expect(
      serviceAreaService.createServiceArea({
        name: "Connaught Place",
        pinCode: "110001",
        zoneId: "zone-1",
      })
    ).rejects.toThrow(ConflictError);
  });

  describe("resolveZoneByPinCode", () => {
    it("resolves active ServiceArea and Zone for a valid PIN code", async () => {
      mockServiceAreaRepo.findByPinCode.mockResolvedValue({
        id: "sa-1",
        name: "Connaught Place",
        pinCode: "110001",
        zoneId: "zone-1",
        isActive: true,
        zone: {
          id: "zone-1",
          code: "ZONE-NORTH",
          name: "North Delivery Zone",
          isActive: true,
        },
      });

      const result = await serviceAreaService.resolveZoneByPinCode("110001");

      expect(result).not.toBeNull();
      expect(result?.zone.code).toBe("ZONE-NORTH");
      expect(result?.serviceArea.pinCode).toBe("110001");
    });

    it("returns null when PIN code is unserviced or inactive", async () => {
      mockServiceAreaRepo.findByPinCode.mockResolvedValue(null);

      const result = await serviceAreaService.resolveZoneByPinCode("999999");
      expect(result).toBeNull();
    });
  });
});
