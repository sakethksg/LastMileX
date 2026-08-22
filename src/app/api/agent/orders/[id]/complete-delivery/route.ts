import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { completeDeliverySchema } from "@/schemas/delivery-execution.schema";
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
      const validated = completeDeliverySchema.parse(body);
      notes = validated.notes ?? null;
    } catch {
      // Optional body
    }

    const result = await deliveryExecutionService.completeDelivery(id, agent.id, notes);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
