import { OrderStatus, UserRole } from "@/types/enums";
import { ValidationError, ForbiddenError } from "@/lib/errors/app-error";

/**
 * Valid state transitions mapping: fromState -> Set of allowed toStates
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CONFIRMED], // CONFIRMED = Admin unassignment
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.FAILED]: [OrderStatus.RESCHEDULED, OrderStatus.CANCELLED],
  [OrderStatus.RESCHEDULED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
};

/**
 * Checks if a transition between two statuses is valid.
 * Admins are allowed standard transitions plus manual administrative override with audit.
 */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role?: UserRole
): boolean {
  if (from === to) {
    return false;
  }

  // Check standard transition graph
  const allowed = ALLOWED_TRANSITIONS[from];
  if (allowed && allowed.includes(to)) {
    return true;
  }

  // Admins can perform overrides on non-terminal states or cancel from anywhere except delivered
  if (role === UserRole.ADMIN) {
    if (from === OrderStatus.DELIVERED) {
      return false; // Cannot transition out of DELIVERED even for admin
    }
    if (to === OrderStatus.CANCELLED) {
      return true; // Admin can cancel any active non-delivered order
    }
  }

  return false;
}

/**
 * Asserts that a status transition is valid, throwing an error if invalid.
 */
export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  role?: UserRole
): void {
  if (!canTransition(from, to, role)) {
    throw new ValidationError(
      `Invalid order status transition from '${from}' to '${to}' for role '${role ?? "USER"}'`
    );
  }
}
