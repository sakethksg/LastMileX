import { apiClient } from "./client";
import { CreateOrderInput } from "@/schemas/order.schema";

export async function fetchCustomerOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.status) query.append("status", params.status);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient(`/api/orders${qs}`);
}

export async function fetchCustomerOrderById(id: string) {
  return apiClient(`/api/orders/${id}`);
}

export async function createOrder(input: CreateOrderInput) {
  return apiClient("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function rescheduleCustomerOrder(id: string, scheduledDate?: string, notes?: string) {
  return apiClient(`/api/orders/${id}/reschedule`, {
    method: "POST",
    body: JSON.stringify({
      scheduledDeliveryDate: scheduledDate || undefined,
      notes: notes || undefined,
    }),
  });
}

// Admin Order APIs
export async function fetchAdminOrders(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient(`/api/admin/orders${qs}`);
}

export async function fetchAdminOrderById(id: string) {
  return apiClient(`/api/admin/orders/${id}`);
}

export async function assignOrderToAgent(orderId: string, agentId: string) {
  return apiClient(`/api/admin/orders/${orderId}/assign`, {
    method: "POST",
    body: JSON.stringify({ agentId }),
  });
}

export async function autoAssignOrder(orderId: string) {
  return apiClient(`/api/admin/orders/${orderId}/auto-assign`, {
    method: "POST",
  });
}

export async function rescheduleAdminOrder(orderId: string, scheduledDate?: string, notes?: string) {
  return apiClient(`/api/admin/orders/${orderId}/reschedule`, {
    method: "POST",
    body: JSON.stringify({
      scheduledDeliveryDate: scheduledDate || undefined,
      notes: notes || undefined,
    }),
  });
}
