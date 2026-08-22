import crypto from "crypto";
import {
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from "./notification-types";

export class MockNotificationProvider implements NotificationProvider {
  private shouldFailNext = false;
  private deliveredPayloads: NotificationPayload[] = [];

  /**
   * For testing: force next delivery to fail
   */
  setShouldFail(shouldFail: boolean) {
    this.shouldFailNext = shouldFail;
  }

  getDeliveredPayloads(): readonly NotificationPayload[] {
    return this.deliveredPayloads;
  }

  clearDeliveredPayloads() {
    this.deliveredPayloads = [];
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      return {
        success: false,
        errorMessage: "Simulated mock provider delivery network timeout",
      };
    }

    const providerMessageId = `mock-msg-${crypto.randomBytes(8).toString("hex")}`;
    this.deliveredPayloads.push(payload);

    return {
      success: true,
      providerMessageId,
    };
  }
}

export const defaultNotificationProvider = new MockNotificationProvider();
