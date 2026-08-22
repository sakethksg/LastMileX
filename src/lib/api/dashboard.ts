import { apiClient } from "./client";
import { CustomerDashboardData, AgentDashboardData, AdminDashboardData } from "@/types/domain";

export async function fetchCustomerDashboard(): Promise<CustomerDashboardData> {
  return apiClient<CustomerDashboardData>("/api/dashboard/customer");
}

export async function fetchAgentDashboard(): Promise<AgentDashboardData> {
  return apiClient<AgentDashboardData>("/api/agent/dashboard");
}

export async function fetchAdminDashboard(params: { from?: string; to?: string } = {}): Promise<AdminDashboardData> {
  const query = new URLSearchParams();
  if (params.from) query.append("from", params.from);
  if (params.to) query.append("to", params.to);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<AdminDashboardData>(`/api/admin/dashboard${qs}`);
}
