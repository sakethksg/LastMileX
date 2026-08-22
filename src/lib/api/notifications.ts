import { apiClient } from "./client";

export async function fetchCustomerNotifications(params: { page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient(`/api/notifications${qs}`);
}

export async function fetchCustomerNotificationById(id: string) {
  return apiClient(`/api/notifications/${id}`);
}

export async function fetchAdminNotifications(params: {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
  userId?: string;
  orderId?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.status) query.append("status", params.status);
  if (params.eventType) query.append("eventType", params.eventType);
  if (params.userId) query.append("userId", params.userId);
  if (params.orderId) query.append("orderId", params.orderId);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient(`/api/admin/notifications${qs}`);
}

export async function retryNotification(id: string) {
  return apiClient(`/api/admin/notifications/${id}/retry`, {
    method: "POST",
  });
}
