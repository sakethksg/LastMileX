import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { orderService } from "@/services/order/order.service";
import { updateOrderStatusSchema } from "@/schemas/order.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    const updatedOrder = await orderService.updateOrderStatus(
      id,
      validatedData.status,
      admin,
      validatedData.note
    );

    return successResponse(updatedOrder);
  } catch (error) {
    return handleApiError(error);
  }
}
