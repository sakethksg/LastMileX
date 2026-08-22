import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { codSurchargeService } from "@/services/cod-surcharge/cod-surcharge.service";
import { updateCodSurchargeSchema } from "@/schemas/cod-surcharge.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const surcharge = await codSurchargeService.getCodSurchargeById(id);

    return successResponse(surcharge);
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
    const validatedData = updateCodSurchargeSchema.parse(body);
    const updatedSurcharge = await codSurchargeService.updateCodSurcharge(id, validatedData);

    return successResponse(updatedSurcharge);
  } catch (error) {
    return handleApiError(error);
  }
}
