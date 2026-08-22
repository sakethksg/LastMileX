import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { agentQuerySchema } from "@/schemas/delivery-agent.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = agentQuerySchema.parse(searchParams);
    const result = await deliveryAgentService.listAgents(query);

    return successResponse(result.agents, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
