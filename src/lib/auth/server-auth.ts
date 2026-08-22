import { createServerSupabaseClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { UserRole } from "@/types/enums";
import { AuthUserContext } from "@/types/domain";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors/app-error";

export async function getCurrentUser(): Promise<AuthUserContext | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const appUser = await userRepository.findById(authUser.id);
    if (!appUser || !appUser.isActive) {
      return null;
    }

    return {
      id: appUser.id,
      email: appUser.email,
      role: appUser.role,
      name: appUser.name,
      isActive: appUser.isActive,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUserContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("Authentication required to access this resource");
  }
  return user;
}

export async function requireRole(requiredRole: UserRole): Promise<AuthUserContext> {
  const user = await requireAuth();
  if (user.role !== requiredRole) {
    throw new ForbiddenError(
      `Access denied. Requires '${requiredRole}' role, but user has '${user.role}'.`
    );
  }
  return user;
}

export async function requireAnyRole(allowedRoles: UserRole[]): Promise<AuthUserContext> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied. Requires one of [${allowedRoles.join(", ")}], but user has '${user.role}'.`
    );
  }
  return user;
}

export async function assertOrderOwnership(
  orderCustomerId: string,
  user: AuthUserContext
): Promise<void> {
  if (user.role === UserRole.ADMIN) {
    return; // Admins bypass customer ownership checks
  }

  if (user.role === UserRole.CUSTOMER && user.id === orderCustomerId) {
    return; // Customer owns the order
  }

  throw new ForbiddenError("You are not authorized to access this order");
}
