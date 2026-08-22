import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { codSurchargeService } from "@/services/cod-surcharge/cod-surcharge.service";
import { createCodSurchargeSchema, codSurchargeQuerySchema } from "@/schemas/cod-surcharge.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = codSurchargeQuerySchema.parse(searchParams);
    const result = await codSurchargeService.listCodSurcharges(query);

    return successResponse(result.codSurcharges, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const body = await request.json();
    const validatedData = createCodSurchargeSchema.parse(body);
    const surcharge = await codSurchargeService.createCodSurcharge(validatedData);

    return successResponse(surcharge, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
