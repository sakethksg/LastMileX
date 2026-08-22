import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { zoneService } from "@/services/zone/zone.service";
import { updateZoneSchema } from "@/schemas/zone.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const zone = await zoneService.getZoneById(id);

    return successResponse(zone);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateZoneSchema.parse(body);
    const updatedZone = await zoneService.updateZone(id, validatedData);

    return successResponse(updatedZone);
  } catch (error) {
    return handleApiError(error);
  }
}
