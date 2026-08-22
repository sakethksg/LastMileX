import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/server-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized: No active session", 401, "UNAUTHORIZED");
    }

    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch user session", 500, "INTERNAL_ERROR");
  }
}
