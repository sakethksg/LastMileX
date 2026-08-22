import { describe, it, expect } from "vitest";
import { MockNotificationProvider } from "@/lib/notifications/notification-provider";
import { NotificationEventType, NotificationType } from "@/types/enums";

describe("MockNotificationProvider", () => {
  it("delivers notification successfully by default and generates providerMessageId", async () => {
    const provider = new MockNotificationProvider();
    const payload = {
      id: "notif-1",
      userId: "user-1",
      type: NotificationType.EMAIL,
      channel: "customer@example.com",
      eventType: NotificationEventType.ORDER_CONFIRMED,
      subject: "Order Confirmed",
      body: "Your order has been confirmed.",
    };

    const result = await provider.send(payload);
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toMatch(/^mock-msg-[a-f0-9]+$/);
    expect(provider.getDeliveredPayloads()).toHaveLength(1);
  });

  it("simulates delivery failure when configured", async () => {
    const provider = new MockNotificationProvider();
    provider.setShouldFail(true);

    const payload = {
      id: "notif-2",
      userId: "user-2",
      type: NotificationType.EMAIL,
      channel: "customer@example.com",
      eventType: NotificationEventType.DELIVERED,
      subject: "Order Delivered",
      body: "Your order has been delivered.",
    };

    const result = await provider.send(payload);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("Simulated mock provider delivery network timeout");
  });
});
