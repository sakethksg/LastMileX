import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { orderQuerySchema } from "@/schemas/order.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const agent = await requireRole(UserRole.DELIVERY_AGENT);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = orderQuerySchema.parse(searchParams);
    const result = await deliveryAgentService.getAgentOrders(agent.id, query);

    return successResponse(result.orders, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
