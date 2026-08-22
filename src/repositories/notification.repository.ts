import { prisma } from "@/lib/prisma";
import {
  NotificationEventType,
  NotificationStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { NotificationDeliveryResult } from "@/lib/notifications/notification-types";

export interface CreateNotificationDbInput {
  userId: string;
  orderId?: string | null;
  type: NotificationType;
  channel: string;
  eventType: NotificationEventType;
  subject: string;
  body: string;
  status?: NotificationStatus;
}

export class NotificationRepository {
  async createNotification(data: CreateNotificationDbInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        orderId: data.orderId ?? null,
        type: data.type,
        channel: data.channel,
        eventType: data.eventType,
        subject: data.subject,
        body: data.body,
        status: data.status ?? NotificationStatus.PENDING,
      },
    });
  }

  async findExistingNotification(
    userId: string,
    orderId: string,
    eventType: NotificationEventType
  ) {
    return prisma.notification.findFirst({
      where: {
        userId,
        orderId,
        eventType,
      },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async listUserNotifications(
    userId: string,
    params?: {
      status?: NotificationStatus;
      eventType?: NotificationEventType;
      type?: NotificationType;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.eventType ? { eventType: params.eventType } : {}),
      ...(params?.type ? { type: params.type } : {}),
    };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { total, notifications };
  }

  async listAdminNotifications(params?: {
    userId?: string;
    orderId?: string;
    status?: NotificationStatus;
    eventType?: NotificationEventType;
    type?: NotificationType;
    dateFrom?: Date;
    dateTo?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.NotificationWhereInput = {
      ...(params?.userId ? { userId: params.userId } : {}),
      ...(params?.orderId ? { orderId: params.orderId } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.eventType ? { eventType: params.eventType } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.dateFrom || params?.dateTo
        ? {
            createdAt: {
              ...(params?.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params?.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
    };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { total, notifications };
  }

  async updateDeliveryResult(id: string, result: NotificationDeliveryResult) {
    if (result.success) {
      return prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.SENT,
          providerMessageId: result.providerMessageId ?? null,
          sentAt: new Date(),
          errorMessage: null,
        },
      });
    }

    return prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage: result.errorMessage ?? "Unknown delivery error",
        retryCount: { increment: 1 },
      },
    });
  }

  async claimForRetry(id: string) {
    // Atomically claim FAILED notification
    const claim = await prisma.notification.updateMany({
      where: {
        id,
        status: NotificationStatus.FAILED,
      },
      data: {
        status: NotificationStatus.RETRYING,
      },
    });

    if (claim.count === 0) {
      return null;
    }

    return prisma.notification.findUnique({
      where: { id },
    });
  }
}

export const notificationRepository = new NotificationRepository();
