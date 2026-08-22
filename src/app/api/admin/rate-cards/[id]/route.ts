import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { rateCardService } from "@/services/rate-card/rate-card.service";
import { updateRateCardSchema } from "@/schemas/rate-card.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const rateCard = await rateCardService.getRateCardById(id);

    return successResponse(rateCard);
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
    const validatedData = updateRateCardSchema.parse(body);
    const updatedCard = await rateCardService.updateRateCard(id, validatedData);

    return successResponse(updatedCard);
  } catch (error) {
    return handleApiError(error);
  }
}
