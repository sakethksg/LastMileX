import { NotificationEventType, UserRole } from "@/types/enums";
import { NotificationEventContext } from "./notification-types";

export interface RenderedTemplate {
  subject: string;
  body: string;
}

/**
 * Generates deterministic subject and body text for notification events.
 */
export function renderNotificationTemplate(
  eventType: NotificationEventType,
  context: NotificationEventContext,
  recipientRole: UserRole = UserRole.CUSTOMER
): RenderedTemplate {
  const {
    orderNumber,
    agentName,
    failureReason,
    scheduledDeliveryDate,
    notes,
  } = context;

  switch (eventType) {
    case NotificationEventType.ORDER_CONFIRMED:
      return {
        subject: `Order Confirmed: ${orderNumber}`,
        body: `Your shipment order ${orderNumber} has been confirmed and is awaiting delivery agent assignment.`,
      };

    case NotificationEventType.ASSIGNED:
      if (recipientRole === UserRole.DELIVERY_AGENT) {
        return {
          subject: `New Order Assigned: ${orderNumber}`,
          body: `You have been assigned to deliver order ${orderNumber}. Please proceed to the pickup location.`,
        };
      }
      return {
        subject: `Order Assigned: ${orderNumber}`,
        body: `Your order ${orderNumber} has been assigned to delivery agent ${agentName ?? "an assigned agent"}.`,
      };

    case NotificationEventType.PICKED_UP:
      return {
        subject: `Order Picked Up: ${orderNumber}`,
        body: `Package for order ${orderNumber} has been picked up from the sender location.`,
      };

    case NotificationEventType.IN_TRANSIT:
      return {
        subject: `Order In Transit: ${orderNumber}`,
        body: `Order ${orderNumber} is currently in transit to the destination address.`,
      };

    case NotificationEventType.OUT_FOR_DELIVERY:
      return {
        subject: `Order Out For Delivery: ${orderNumber}`,
        body: `Order ${orderNumber} is out for delivery. The delivery agent will arrive shortly.`,
      };

    case NotificationEventType.DELIVERED:
      return {
        subject: `Order Delivered: ${orderNumber}`,
        body: `Order ${orderNumber} has been successfully delivered. Thank you for choosing LastMileX!`,
      };

    case NotificationEventType.FAILED:
      const reasonText = failureReason ? ` (Reason: ${failureReason})` : "";
      return {
        subject: `Delivery Attempt Failed: ${orderNumber}`,
        body: `Delivery attempt for order ${orderNumber} was unsuccessful${reasonText}. You may reschedule delivery from your orders dashboard.`,
      };

    case NotificationEventType.RESCHEDULED:
      const dateText = scheduledDeliveryDate
        ? ` for ${new Date(scheduledDeliveryDate).toLocaleDateString("en-IN")}`
        : "";
      return {
        subject: `Order Rescheduled: ${orderNumber}`,
        body: `Order ${orderNumber} has been rescheduled${dateText}. A delivery agent will be assigned for the new date.`,
      };

    case NotificationEventType.ORDER_CANCELLED:
      const cancelNote = notes ? ` Note: ${notes}` : "";
      return {
        subject: `Order Cancelled: ${orderNumber}`,
        body: `Order ${orderNumber} has been cancelled.${cancelNote}`,
      };

    default:
      return {
        subject: `Update on Order ${orderNumber}`,
        body: `Order ${orderNumber} status has been updated.`,
      };
  }
}
