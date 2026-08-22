import { apiClient } from "./client";
import { DeliveryFailureReason } from "@/schemas/delivery-execution.schema";
import { UpdateAgentProfileInput } from "@/schemas/delivery-agent.schema";

// Agent Delivery Execution APIs
export async function fetchAgentAssignedOrders() {
  return apiClient("/api/agent/orders");
}

export async function fetchAgentOrderById(id: string) {
  return apiClient(`/api/agent/orders/${id}`);
}

export async function pickupOrder(id: string) {
  return apiClient(`/api/agent/orders/${id}/pickup`, {
    method: "POST",
  });
}

export async function startDelivery(id: string) {
  return apiClient(`/api/agent/orders/${id}/start-delivery`, {
    method: "POST",
  });
}

export async function outForDelivery(id: string) {
  return apiClient(`/api/agent/orders/${id}/out-for-delivery`, {
    method: "POST",
  });
}

export async function completeDelivery(id: string) {
  return apiClient(`/api/agent/orders/${id}/complete-delivery`, {
    method: "POST",
  });
}

export async function failDelivery(id: string, reason: DeliveryFailureReason, notes?: string) {
  return apiClient(`/api/agent/orders/${id}/fail-delivery`, {
    method: "POST",
    body: JSON.stringify({ reason, notes }),
  });
}

// Admin Agent Management APIs
export async function fetchAdminAgents(params: {
  page?: number;
  limit?: number;
  availability?: string;
  currentZoneId?: string;
  search?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.availability) query.append("availability", params.availability);
  if (params.currentZoneId) query.append("currentZoneId", params.currentZoneId);
  if (params.search) query.append("search", params.search);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient(`/api/admin/agents${qs}`);
}

export async function fetchAdminAgentById(id: string) {
  return apiClient(`/api/admin/agents/${id}`);
}

export async function updateAdminAgentProfile(id: string, input: UpdateAgentProfileInput) {
  return apiClient(`/api/admin/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
