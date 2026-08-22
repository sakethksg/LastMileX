import { apiClient } from "./client";
import { AuthUserContext } from "@/types/domain";

export async function fetchCurrentUser(): Promise<AuthUserContext | null> {
  try {
    return await apiClient<AuthUserContext>("/api/auth/me");
  } catch (err: any) {
    if (err.status === 401) {
      return null;
    }
    throw err;
  }
}
