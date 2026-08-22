import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { dashboardQuerySchema } from "@/schemas/dashboard.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const agent = await requireRole(UserRole.DELIVERY_AGENT);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = dashboardQuerySchema.parse(searchParams);
    const dashboard = await dashboardService.getAgentDashboard(agent.id, query);

    return successResponse(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
