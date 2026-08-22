import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { serviceAreaService } from "@/services/service-area/service-area.service";
import { createServiceAreaSchema, serviceAreaQuerySchema } from "@/schemas/service-area.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = serviceAreaQuerySchema.parse(searchParams);
    const result = await serviceAreaService.listServiceAreas(query);

    return successResponse(result.serviceAreas, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const body = await request.json();
    const validatedData = createServiceAreaSchema.parse(body);
    const serviceArea = await serviceAreaService.createServiceArea(validatedData);

    return successResponse(serviceArea, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
