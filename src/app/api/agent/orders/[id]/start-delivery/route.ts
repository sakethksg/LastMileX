import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { updateDeliveryProgressSchema } from "@/schemas/delivery-execution.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await requireRole(UserRole.DELIVERY_AGENT);
    const { id } = await params;

    let notes: string | null = null;
    try {
      const body = await request.json();
      const validated = updateDeliveryProgressSchema.parse(body);
      notes = validated.notes ?? null;
    } catch {
      // Notes are optional
    }

    const result = await deliveryExecutionService.startDelivery(id, agent.id, notes);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
