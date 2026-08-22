import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { zoneService } from "@/services/zone/zone.service";
import { createZoneSchema, zoneQuerySchema } from "@/schemas/zone.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = zoneQuerySchema.parse(searchParams);
    const result = await zoneService.listZones(query);

    return successResponse(result.zones, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const body = await request.json();
    const validatedData = createZoneSchema.parse(body);
    const zone = await zoneService.createZone(validatedData);

    return successResponse(zone, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
