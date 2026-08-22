import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { notificationService } from "@/services/notification/notification.service";
import { notificationQuerySchema } from "@/schemas/notification.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = notificationQuerySchema.parse(searchParams);
    const result = await notificationService.getAdminNotifications(query);

    return successResponse(result.notifications, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
