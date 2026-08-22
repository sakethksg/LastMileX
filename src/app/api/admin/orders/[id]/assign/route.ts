import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { manualAssignSchema } from "@/schemas/assignment.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const body = await request.json();
    const validatedData = manualAssignSchema.parse(body);

    const result = await deliveryAgentService.manualAssignOrder(
      id,
      validatedData.agentId,
      admin.id,
      validatedData.notes
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
