import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { notificationService } from "@/services/notification/notification.service";
import { notificationQuerySchema } from "@/schemas/notification.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = notificationQuerySchema.parse(searchParams);
    const result = await notificationService.getUserNotifications(user.id, query);

    return successResponse(result.notifications, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
