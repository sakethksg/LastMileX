import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { failDeliverySchema } from "@/schemas/delivery-execution.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await requireRole(UserRole.DELIVERY_AGENT);
    const { id } = await params;

    const body = await request.json();
    const validated = failDeliverySchema.parse(body);

    const result = await deliveryExecutionService.failDelivery(
      id,
      agent.id,
      validated.failureReason,
      validated.notes
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
