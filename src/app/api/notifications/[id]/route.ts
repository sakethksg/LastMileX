import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { notificationService } from "@/services/notification/notification.service";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const notification = await notificationService.getUserNotificationById(user.id, id);

    return successResponse(notification);
  } catch (error) {
    return handleApiError(error);
  }
}
