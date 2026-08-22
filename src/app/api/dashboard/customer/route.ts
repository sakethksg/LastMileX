import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { dashboardQuerySchema } from "@/schemas/dashboard.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = dashboardQuerySchema.parse(searchParams);
    const dashboard = await dashboardService.getCustomerDashboard(user.id, query);

    return successResponse(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
