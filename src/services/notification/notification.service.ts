import {
  notificationRepository,
  NotificationRepository,
} from "@/repositories/notification.repository";
import {
  notificationDispatcher,
  NotificationDispatcher,
} from "./notification-dispatcher";
import { renderNotificationTemplate } from "@/lib/notifications/notification-templates";
import {
  NotificationEventContext,
} from "@/lib/notifications/notification-types";
import {
  NotificationEventType,
  NotificationType,
  UserRole,
} from "@/types/enums";
import { NotificationQueryInput } from "@/schemas/notification.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/lib/errors/app-error";

export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository = notificationRepository,
    private readonly dispatcher: NotificationDispatcher = notificationDispatcher
  ) {}

  /**
   * Creates notification records idempotently and triggers delivery via the dispatcher.
   */
  async createAndDispatchEventNotifications(
    eventType: NotificationEventType,
    context: NotificationEventContext
  ) {
    const createdNotifications = [];

    // 1. Customer Notification
    if (context.customerId) {
      const existingCustomerNotif = await this.repo.findExistingNotification(
        context.customerId,
        context.orderId,
        eventType
      );

      if (!existingCustomerNotif) {
        const { subject, body } = renderNotificationTemplate(
          eventType,
          context,
          UserRole.CUSTOMER
        );

        const channel = context.customerEmail ?? `user-${context.customerId}@lastmilex.local`;

        const notification = await this.repo.createNotification({
          userId: context.customerId,
          orderId: context.orderId,
          type: NotificationType.EMAIL,
          channel,
          eventType,
          subject,
          body,
        });

        // Dispatch asynchronously / immediately without blocking core transaction
        try {
          const dispatched = await this.dispatcher.dispatch(notification);
          createdNotifications.push(dispatched);
        } catch {
          // If dispatch throws unexpectedly, notification record is still saved in PENDING/FAILED state
          createdNotifications.push(notification);
        }
      }
    }

    // 2. Delivery Agent Notification (for assignment events)
    if (
      context.agentId &&
      (eventType === NotificationEventType.ASSIGNED ||
        eventType === NotificationEventType.RESCHEDULED)
    ) {
      const existingAgentNotif = await this.repo.findExistingNotification(
        context.agentId,
        context.orderId,
        eventType
      );

      if (!existingAgentNotif) {
        const { subject, body } = renderNotificationTemplate(
          eventType,
          context,
          UserRole.DELIVERY_AGENT
        );

        const channel = context.agentEmail ?? `agent-${context.agentId}@lastmilex.local`;

        const agentNotification = await this.repo.createNotification({
          userId: context.agentId,
          orderId: context.orderId,
          type: NotificationType.EMAIL,
          channel,
          eventType,
          subject,
          body,
        });

        try {
          const dispatched = await this.dispatcher.dispatch(agentNotification);
          createdNotifications.push(dispatched);
        } catch {
          createdNotifications.push(agentNotification);
        }
      }
    }

    return createdNotifications;
  }

  async getUserNotifications(userId: string, query?: NotificationQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, notifications } = await this.repo.listUserNotifications(userId, {
      status: query?.status,
      eventType: query?.eventType,
      type: query?.type,
      skip,
      take: limit,
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserNotificationById(userId: string, notificationId: string) {
    const notification = await this.repo.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID '${notificationId}' not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("You are not authorized to view this notification");
    }

    return notification;
  }

  async getAdminNotifications(query?: NotificationQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, notifications } = await this.repo.listAdminNotifications({
      userId: query?.userId,
      orderId: query?.orderId,
      status: query?.status,
      eventType: query?.eventType,
      type: query?.type,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
      skip,
      take: limit,
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAdminNotificationById(notificationId: string) {
    const notification = await this.repo.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID '${notificationId}' not found`);
    }
    return notification;
  }

  async retryNotification(notificationId: string) {
    const claimed = await this.repo.claimForRetry(notificationId);
    if (!claimed) {
      throw new ConflictError(
        `Notification '${notificationId}' is not in FAILED status or is currently being retried`
      );
    }

    return this.dispatcher.dispatch(claimed);
  }
}

export const notificationService = new NotificationService();
