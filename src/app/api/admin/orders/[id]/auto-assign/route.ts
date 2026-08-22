import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { autoAssignSchema } from "@/schemas/assignment.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(UserRole.ADMIN);
    const { id } = await params;

    let notes: string | null = null;
    try {
      const body = await request.json();
      const validatedData = autoAssignSchema.parse(body);
      notes = validatedData.notes ?? null;
    } catch {
      // Body is optional for auto-assignment
    }

    const result = await deliveryAgentService.autoAssignOrder(id, admin.id, notes);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
