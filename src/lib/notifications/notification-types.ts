import {
  NotificationEventType,
  NotificationStatus,
  NotificationType,
} from "@/types/enums";

export interface NotificationPayload {
  id: string;
  userId: string;
  orderId?: string | null;
  type: NotificationType;
  channel: string;
  eventType: NotificationEventType;
  subject: string;
  body: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationDeliveryResult>;
}

export interface NotificationEventContext {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  attemptNumber?: number;
  failureReason?: string | null;
  scheduledDeliveryDate?: Date | null;
  notes?: string | null;
}
