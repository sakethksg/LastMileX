import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { notificationService } from "@/services/notification/notification.service";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const result = await notificationService.retryNotification(id);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
