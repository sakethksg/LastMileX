import {
  notificationRepository,
  NotificationRepository,
} from "@/repositories/notification.repository";
import {
  defaultNotificationProvider,
  MockNotificationProvider,
} from "@/lib/notifications/notification-provider";
import {
  NotificationPayload,
  NotificationProvider,
} from "@/lib/notifications/notification-types";
import { Notification } from "@prisma/client";

export class NotificationDispatcher {
  constructor(
    private readonly repo: NotificationRepository = notificationRepository,
    private readonly provider: NotificationProvider = defaultNotificationProvider
  ) {}

  async dispatch(notification: Notification) {
    const payload: NotificationPayload = {
      id: notification.id,
      userId: notification.userId,
      orderId: notification.orderId,
      type: notification.type,
      channel: notification.channel,
      eventType: notification.eventType,
      subject: notification.subject,
      body: notification.body,
    };

    const deliveryResult = await this.provider.send(payload);
    return this.repo.updateDeliveryResult(notification.id, deliveryResult);
  }
}

export const notificationDispatcher = new NotificationDispatcher();
