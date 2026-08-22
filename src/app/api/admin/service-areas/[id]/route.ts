import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { serviceAreaService } from "@/services/service-area/service-area.service";
import { updateServiceAreaSchema } from "@/schemas/service-area.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const area = await serviceAreaService.getServiceAreaById(id);

    return successResponse(area);
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
    const validatedData = updateServiceAreaSchema.parse(body);
    const updatedArea = await serviceAreaService.updateServiceArea(id, validatedData);

    return successResponse(updatedArea);
  } catch (error) {
    return handleApiError(error);
  }
}
