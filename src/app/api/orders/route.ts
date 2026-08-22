import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { orderService } from "@/services/order/order.service";
import { createOrderSchema, orderQuerySchema } from "@/schemas/order.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = orderQuerySchema.parse(searchParams);
    const result = await orderService.getCustomerOrders(user.id, query);

    return successResponse(result.orders, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);
    const order = await orderService.createCustomerOrder(user.id, validatedData);

    return successResponse(order, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
