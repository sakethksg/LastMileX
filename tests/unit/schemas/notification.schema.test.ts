import { describe, it, expect } from "vitest";
import { notificationQuerySchema } from "@/schemas/notification.schema";
import { NotificationEventType, NotificationStatus, NotificationType } from "@/types/enums";

describe("Notification Schema Validation", () => {
  it("validates and transforms query filters correctly", () => {
    const rawQuery = {
      status: NotificationStatus.SENT,
      eventType: NotificationEventType.DELIVERED,
      type: NotificationType.EMAIL,
      page: "3",
      limit: "15",
    };

    const parsed = notificationQuerySchema.parse(rawQuery);
    expect(parsed.status).toBe(NotificationStatus.SENT);
    expect(parsed.eventType).toBe(NotificationEventType.DELIVERED);
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(15);
  });
});
