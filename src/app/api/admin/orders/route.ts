import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { orderService } from "@/services/order/order.service";
import { adminCreateOrderSchema, orderQuerySchema } from "@/schemas/order.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = orderQuerySchema.parse(searchParams);
    const result = await orderService.getAdminOrders(query);

    return successResponse(result.orders, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(UserRole.ADMIN);

    const body = await request.json();
    const validatedData = adminCreateOrderSchema.parse(body);
    const order = await orderService.createAdminOrder(admin.id, validatedData);

    return successResponse(order, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
