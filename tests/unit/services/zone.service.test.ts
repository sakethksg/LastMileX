import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZoneService } from "@/services/zone/zone.service";
import { ZoneRepository } from "@/repositories/zone.repository";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

describe("ZoneService", () => {
  let zoneService: ZoneService;
  let mockZoneRepo: {
    findById: ReturnType<typeof vi.fn>;
    findByCode: ReturnType<typeof vi.fn>;
    findByName: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockZoneRepo = {
      findById: vi.fn(),
      findByCode: vi.fn(),
      findByName: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
    };
    zoneService = new ZoneService(mockZoneRepo as unknown as ZoneRepository);
  });

  it("creates a zone successfully when code and name are unique", async () => {
    mockZoneRepo.findByCode.mockResolvedValue(null);
    mockZoneRepo.findByName.mockResolvedValue(null);
    mockZoneRepo.create.mockResolvedValue({
      id: "zone-123",
      code: "ZONE-EAST",
      name: "East Zone",
      description: "Eastern region",
      isActive: true,
    });

    const result = await zoneService.createZone({
      name: "East Zone",
      code: "ZONE-EAST",
      description: "Eastern region",
    });

    expect(result.code).toBe("ZONE-EAST");
    expect(mockZoneRepo.create).toHaveBeenCalledWith({
      name: "East Zone",
      code: "ZONE-EAST",
      description: "Eastern region",
    });
  });

  it("throws ConflictError when zone code already exists", async () => {
    mockZoneRepo.findByCode.mockResolvedValue({ id: "existing-id", code: "ZONE-EAST" });

    await expect(
      zoneService.createZone({
        name: "New Name",
        code: "ZONE-EAST",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("throws ConflictError when zone name already exists", async () => {
    mockZoneRepo.findByCode.mockResolvedValue(null);
    mockZoneRepo.findByName.mockResolvedValue({ id: "existing-id", name: "East Zone" });

    await expect(
      zoneService.createZone({
        name: "East Zone",
        code: "ZONE-UNIQUE",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("updates and deactivates a zone successfully", async () => {
    mockZoneRepo.findById.mockResolvedValue({
      id: "zone-123",
      code: "ZONE-EAST",
      name: "East Zone",
      isActive: true,
    });
    mockZoneRepo.update.mockResolvedValue({
      id: "zone-123",
      code: "ZONE-EAST",
      name: "East Zone",
      isActive: false,
    });

    const result = await zoneService.toggleZoneActive("zone-123", false);
    expect(result.isActive).toBe(false);
    expect(mockZoneRepo.update).toHaveBeenCalledWith("zone-123", { isActive: false });
  });

  it("throws NotFoundError when getting non-existent zone", async () => {
    mockZoneRepo.findById.mockResolvedValue(null);

    await expect(zoneService.getZoneById("non-existent")).rejects.toThrow(NotFoundError);
  });
});
