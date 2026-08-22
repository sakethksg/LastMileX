import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { updateAgentProfileSchema } from "@/schemas/delivery-agent.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const agent = await deliveryAgentService.getAgentById(id);

    return successResponse(agent);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAgentProfileSchema.parse(body);

    const updatedProfile = await deliveryAgentService.updateAgentProfile(id, validatedData);

    return successResponse(updatedProfile);
  } catch (error) {
    return handleApiError(error);
  }
}
