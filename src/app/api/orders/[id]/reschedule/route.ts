import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { deliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { rescheduleOrderSchema } from "@/schemas/delivery-execution.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    let scheduledDeliveryDate: Date | null = null;
    let notes: string | null = null;

    try {
      const body = await request.json();
      const validated = rescheduleOrderSchema.parse(body);
      scheduledDeliveryDate = validated.scheduledDeliveryDate ?? null;
      notes = validated.notes ?? null;
    } catch {
      // Body is optional
    }

    const result = await deliveryExecutionService.rescheduleOrder(
      id,
      user.id,
      user.role,
      scheduledDeliveryDate,
      notes
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
