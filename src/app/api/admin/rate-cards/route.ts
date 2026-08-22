import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { rateCardService } from "@/services/rate-card/rate-card.service";
import { createRateCardSchema, rateCardQuerySchema } from "@/schemas/rate-card.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = rateCardQuerySchema.parse(searchParams);
    const result = await rateCardService.listRateCards(query);

    return successResponse(result.rateCards, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const body = await request.json();
    const validatedData = createRateCardSchema.parse(body);
    const rateCard = await rateCardService.createRateCard(validatedData);

    return successResponse(rateCard, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
