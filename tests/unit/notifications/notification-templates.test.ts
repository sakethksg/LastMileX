import { describe, it, expect } from "vitest";
import { renderNotificationTemplate } from "@/lib/notifications/notification-templates";
import { NotificationEventType, UserRole } from "@/types/enums";

describe("Notification Templates", () => {
  const sampleContext = {
    orderId: "order-1",
    orderNumber: "LMX-20260822-ABC123",
    customerId: "cust-1",
    agentId: "agent-1",
    agentName: "Ramesh Agent",
    failureReason: "CUSTOMER_UNAVAILABLE",
    scheduledDeliveryDate: new Date("2026-08-25T10:00:00Z"),
  };

  it("renders ORDER_CONFIRMED template", () => {
    const rendered = renderNotificationTemplate(
      NotificationEventType.ORDER_CONFIRMED,
      sampleContext
    );
    expect(rendered.subject).toBe("Order Confirmed: LMX-20260822-ABC123");
    expect(rendered.body).toContain("confirmed");
  });

  it("renders ASSIGNED template for customer and agent differently", () => {
    const customerRendered = renderNotificationTemplate(
      NotificationEventType.ASSIGNED,
      sampleContext,
      UserRole.CUSTOMER
    );
    expect(customerRendered.subject).toBe("Order Assigned: LMX-20260822-ABC123");
    expect(customerRendered.body).toContain("Ramesh Agent");

    const agentRendered = renderNotificationTemplate(
      NotificationEventType.ASSIGNED,
      sampleContext,
      UserRole.DELIVERY_AGENT
    );
    expect(agentRendered.subject).toBe("New Order Assigned: LMX-20260822-ABC123");
    expect(agentRendered.body).toContain("You have been assigned");
  });

  it("renders FAILED template with failure reason", () => {
    const rendered = renderNotificationTemplate(
      NotificationEventType.FAILED,
      sampleContext
    );
    expect(rendered.subject).toBe("Delivery Attempt Failed: LMX-20260822-ABC123");
    expect(rendered.body).toContain("CUSTOMER_UNAVAILABLE");
  });

  it("renders RESCHEDULED template with scheduled date", () => {
    const rendered = renderNotificationTemplate(
      NotificationEventType.RESCHEDULED,
      sampleContext
    );
    expect(rendered.subject).toBe("Order Rescheduled: LMX-20260822-ABC123");
    expect(rendered.body).toContain("rescheduled");
  });
});
