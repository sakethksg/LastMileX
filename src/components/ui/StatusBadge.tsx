import React from "react";
import { OrderStatus, AttemptStatus, AgentAvailability, NotificationStatus } from "@/types/enums";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const styles: Record<string, string> = {
    [OrderStatus.CREATED]: "bg-surface-3/40 text-ink-muted border-hairline",
    [OrderStatus.CONFIRMED]: "bg-product-terraform/15 text-product-terraform-bright border-product-terraform/30",
    [OrderStatus.ASSIGNED]: "bg-product-terraform/20 text-product-terraform-bright border-product-terraform/40",
    [OrderStatus.PICKED_UP]: "bg-product-waypoint/15 text-product-waypoint border-product-waypoint/30",
    [OrderStatus.IN_TRANSIT]: "bg-product-waypoint/20 text-product-waypoint border-product-waypoint/40",
    [OrderStatus.OUT_FOR_DELIVERY]: "bg-product-vault/20 text-product-vault border-product-vault/40 font-semibold animate-pulse",
    [OrderStatus.DELIVERED]: "bg-product-nomad/20 text-product-nomad border-product-nomad/40 font-semibold",
    [OrderStatus.FAILED]: "bg-product-consul/20 text-product-consul border-product-consul/40 font-semibold",
    [OrderStatus.RESCHEDULED]: "bg-amber-200/20 text-amber-200 border-amber-200/40",
    [OrderStatus.CANCELLED]: "bg-surface-2 text-ink-subtle border-hairline",
  };

  const style = styles[status] || "bg-surface-2 text-ink-muted border-hairline";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-mono uppercase tracking-wider border ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AgentAvailabilityBadge({ availability }: { availability: AgentAvailability | string }) {
  const styles: Record<string, { bg: string; dot: string; text: string }> = {
    [AgentAvailability.AVAILABLE]: {
      bg: "bg-product-nomad/15 border-product-nomad/30",
      dot: "bg-product-nomad",
      text: "text-product-nomad",
    },
    [AgentAvailability.BUSY]: {
      bg: "bg-product-vault/15 border-product-vault/30",
      dot: "bg-product-vault",
      text: "text-product-vault",
    },
    [AgentAvailability.OFFLINE]: {
      bg: "bg-surface-2 border-hairline",
      dot: "bg-ink-subtle",
      text: "text-ink-muted",
    },
  };

  const current = styles[availability] || styles[AgentAvailability.OFFLINE];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-medium border ${current.bg} ${current.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {availability.replace(/_/g, " ")}
    </span>
  );
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus | string }) {
  const styles: Record<string, string> = {
    [NotificationStatus.PENDING]: "bg-product-vault/15 text-product-vault border-product-vault/30",
    [NotificationStatus.SENT]: "bg-product-nomad/15 text-product-nomad border-product-nomad/30",
    [NotificationStatus.FAILED]: "bg-product-consul/20 text-product-consul border-product-consul/40 font-semibold",
    [NotificationStatus.RETRYING]: "bg-product-terraform/20 text-product-terraform-bright border-product-terraform/40",
  };

  const style = styles[status] || "bg-surface-2 text-ink-muted border-hairline";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-mono border ${style}`}>
      {status}
    </span>
  );
}
