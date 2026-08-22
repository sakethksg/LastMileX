import { UserRole } from "@/types/enums";
import { AuthUserContext } from "@/types/domain";

export function hasRole(user: AuthUserContext | null | undefined, requiredRole: UserRole): boolean {
  if (!user || !user.isActive) return false;
  return user.role === requiredRole;
}

export function hasAnyRole(user: AuthUserContext | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!user || !user.isActive) return false;
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: AuthUserContext | null | undefined): boolean {
  return hasRole(user, UserRole.ADMIN);
}

export function isCustomer(user: AuthUserContext | null | undefined): boolean {
  return hasRole(user, UserRole.CUSTOMER);
}

export function isDeliveryAgent(user: AuthUserContext | null | undefined): boolean {
  return hasRole(user, UserRole.DELIVERY_AGENT);
}

export function canAccessOrder(
  user: AuthUserContext | null | undefined,
  order: { customerId: string; assignedAgentId?: string | null }
): boolean {
  if (!user || !user.isActive) return false;

  // Admins can access all orders
  if (user.role === UserRole.ADMIN) return true;

  // Customers can access only their own orders
  if (user.role === UserRole.CUSTOMER) {
    return user.id === order.customerId;
  }

  // Delivery agents can access only orders assigned to them
  if (user.role === UserRole.DELIVERY_AGENT) {
    return user.id === order.assignedAgentId;
  }

  return false;
}
