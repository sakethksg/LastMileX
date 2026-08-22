import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "@/services/notification/notification.service";
import { NotificationRepository } from "@/repositories/notification.repository";
import { NotificationDispatcher } from "@/services/notification/notification-dispatcher";
import {
  NotificationEventType,
  NotificationStatus,
  NotificationType,
} from "@/types/enums";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors/app-error";

describe("NotificationService", () => {
  let service: NotificationService;
  let mockRepo: {
    createNotification: ReturnType<typeof vi.fn>;
    findExistingNotification: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    listUserNotifications: ReturnType<typeof vi.fn>;
    listAdminNotifications: ReturnType<typeof vi.fn>;
    updateDeliveryResult: ReturnType<typeof vi.fn>;
    claimForRetry: ReturnType<typeof vi.fn>;
  };
  let mockDispatcher: {
    dispatch: ReturnType<typeof vi.fn>;
  };

  const sampleContext = {
    orderId: "order-1",
    orderNumber: "LMX-20260822-123456",
    customerId: "customer-1",
    customerEmail: "customer@example.com",
    agentId: "agent-1",
    agentName: "Ramesh Agent",
    agentEmail: "agent@example.com",
  };

  beforeEach(() => {
    mockRepo = {
      createNotification: vi.fn(),
      findExistingNotification: vi.fn(),
      findById: vi.fn(),
      listUserNotifications: vi.fn(),
      listAdminNotifications: vi.fn(),
      updateDeliveryResult: vi.fn(),
      claimForRetry: vi.fn(),
    };
    mockDispatcher = {
      dispatch: vi.fn(),
    };

    service = new NotificationService(
      mockRepo as unknown as NotificationRepository,
      mockDispatcher as unknown as NotificationDispatcher
    );
  });

  describe("createAndDispatchEventNotifications", () => {
    it("creates and dispatches notification for customer on ORDER_CONFIRMED", async () => {
      mockRepo.findExistingNotification.mockResolvedValue(null);
      mockRepo.createNotification.mockResolvedValue({
        id: "notif-1",
        userId: "customer-1",
        orderId: "order-1",
        type: NotificationType.EMAIL,
        channel: "customer@example.com",
        eventType: NotificationEventType.ORDER_CONFIRMED,
        subject: "Order Confirmed: LMX-20260822-123456",
        body: "Your shipment order LMX-20260822-123456 has been confirmed...",
        status: NotificationStatus.PENDING,
      });

      mockDispatcher.dispatch.mockResolvedValue({
        id: "notif-1",
        status: NotificationStatus.SENT,
      });

      const results = await service.createAndDispatchEventNotifications(
        NotificationEventType.ORDER_CONFIRMED,
        sampleContext
      );

      expect(mockRepo.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "customer-1",
          eventType: NotificationEventType.ORDER_CONFIRMED,
        })
      );
      expect(mockDispatcher.dispatch).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it("creates both customer and agent notifications on ASSIGNED event", async () => {
      mockRepo.findExistingNotification.mockResolvedValue(null);
      mockRepo.createNotification
        .mockResolvedValueOnce({
          id: "notif-cust",
          userId: "customer-1",
          eventType: NotificationEventType.ASSIGNED,
        })
        .mockResolvedValueOnce({
          id: "notif-agent",
          userId: "agent-1",
          eventType: NotificationEventType.ASSIGNED,
        });

      mockDispatcher.dispatch.mockImplementation(async (notif) => ({
        ...notif,
        status: NotificationStatus.SENT,
      }));

      const results = await service.createAndDispatchEventNotifications(
        NotificationEventType.ASSIGNED,
        sampleContext
      );

      expect(mockRepo.createNotification).toHaveBeenCalledTimes(2);
      expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it("skips duplicate notification creation if event notification already exists (Idempotency)", async () => {
      mockRepo.findExistingNotification.mockResolvedValue({
        id: "existing-notif-1",
        status: NotificationStatus.SENT,
      });

      const results = await service.createAndDispatchEventNotifications(
        NotificationEventType.DELIVERED,
        sampleContext
      );

      expect(mockRepo.createNotification).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });
  });

  describe("Ownership & Retry", () => {
    it("throws ForbiddenError if customer tries to view another user's notification", async () => {
      mockRepo.findById.mockResolvedValue({
        id: "notif-1",
        userId: "other-user-uuid",
      });

      await expect(
        service.getUserNotificationById("customer-1", "notif-1")
      ).rejects.toThrow(ForbiddenError);
    });

    it("retries a FAILED notification", async () => {
      mockRepo.claimForRetry.mockResolvedValue({
        id: "notif-1",
        status: NotificationStatus.RETRYING,
      });
      mockDispatcher.dispatch.mockResolvedValue({
        id: "notif-1",
        status: NotificationStatus.SENT,
      });

      const result = await service.retryNotification("notif-1");
      expect(mockRepo.claimForRetry).toHaveBeenCalledWith("notif-1");
      expect(mockDispatcher.dispatch).toHaveBeenCalled();
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it("throws ConflictError when retrying non-failed notification", async () => {
      mockRepo.claimForRetry.mockResolvedValue(null);

      await expect(service.retryNotification("notif-sent")).rejects.toThrow(
        ConflictError
      );
    });
  });
});
