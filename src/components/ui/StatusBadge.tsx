import React from "react";
import { OrderStatus, AttemptStatus, AgentAvailability, NotificationStatus } from "@/types/enums";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const styles: Record<string, string> = {
    [OrderStatus.CREATED]: "bg-gray-100 text-gray-800 border-gray-300",
    [OrderStatus.CONFIRMED]: "bg-blue-50 text-blue-700 border-blue-200",
    [OrderStatus.ASSIGNED]: "bg-indigo-50 text-indigo-700 border-indigo-200",
    [OrderStatus.PICKED_UP]: "bg-yellow-50 text-yellow-800 border-yellow-200",
    [OrderStatus.IN_TRANSIT]: "bg-purple-50 text-purple-700 border-purple-200",
    [OrderStatus.OUT_FOR_DELIVERY]: "bg-amber-50 text-amber-800 border-amber-300 font-semibold animate-pulse",
    [OrderStatus.DELIVERED]: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold",
    [OrderStatus.FAILED]: "bg-red-50 text-red-700 border-red-300 font-semibold",
    [OrderStatus.RESCHEDULED]: "bg-orange-50 text-orange-700 border-orange-200",
    [OrderStatus.CANCELLED]: "bg-gray-200 text-gray-600 border-gray-400",
  };

  const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AgentAvailabilityBadge({ availability }: { availability: AgentAvailability | string }) {
  const styles: Record<string, { bg: string; dot: string; text: string }> = {
    [AgentAvailability.AVAILABLE]: { bg: "bg-green-50 border-green-200", dot: "bg-green-500", text: "text-green-800" },
    [AgentAvailability.BUSY]: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-800" },
    [AgentAvailability.OFFLINE]: { bg: "bg-gray-100 border-gray-200", dot: "bg-gray-400", text: "text-gray-600" },
  };

  const current = styles[availability] || styles[AgentAvailability.OFFLINE];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {availability.replace(/_/g, " ")}
    </span>
  );
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus | string }) {
  const styles: Record<string, string> = {
    [NotificationStatus.PENDING]: "bg-yellow-50 text-yellow-800 border-yellow-200",
    [NotificationStatus.SENT]: "bg-blue-50 text-blue-700 border-blue-200",
    [NotificationStatus.FAILED]: "bg-red-50 text-red-700 border-red-300 font-semibold",
    [NotificationStatus.RETRYING]: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}
