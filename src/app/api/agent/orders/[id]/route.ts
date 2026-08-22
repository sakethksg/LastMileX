import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await requireRole(UserRole.DELIVERY_AGENT);
    const { id } = await params;
    const order = await deliveryAgentService.getAgentOrderById(agent.id, id);

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
