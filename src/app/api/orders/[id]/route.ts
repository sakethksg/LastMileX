import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { orderService } from "@/services/order/order.service";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const order = await orderService.getCustomerOrderById(user.id, id);

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
