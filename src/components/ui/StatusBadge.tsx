import React from "react";
import { OrderStatus, AgentAvailability, NotificationStatus } from "@/types/enums";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const styles: Record<string, string> = {
    [OrderStatus.CREATED]: "bg-surface-2 text-ink-muted border-hairline-soft",
    [OrderStatus.CONFIRMED]: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    [OrderStatus.ASSIGNED]: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    [OrderStatus.PICKED_UP]: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    [OrderStatus.IN_TRANSIT]: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    [OrderStatus.OUT_FOR_DELIVERY]: "bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium",
    [OrderStatus.DELIVERED]: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium",
    [OrderStatus.FAILED]: "bg-rose-500/15 text-rose-400 border-rose-500/30 font-medium",
    [OrderStatus.RESCHEDULED]: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    [OrderStatus.CANCELLED]: "bg-surface-2 text-ink-subtle border-hairline-soft",
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
      bg: "bg-emerald-500/10 border-emerald-500/20",
      dot: "bg-emerald-400",
      text: "text-emerald-400",
    },
    [AgentAvailability.BUSY]: {
      bg: "bg-amber-500/10 border-amber-500/20",
      dot: "bg-amber-400",
      text: "text-amber-400",
    },
    [AgentAvailability.OFFLINE]: {
      bg: "bg-surface-2 border-hairline-soft",
      dot: "bg-ink-subtle",
      text: "text-ink-muted",
    },
  };

  const normalizedAvailability = availability || AgentAvailability.OFFLINE;
  const current = styles[normalizedAvailability] || styles[AgentAvailability.OFFLINE];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-medium border ${current.bg} ${current.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {normalizedAvailability.replace(/_/g, " ")}
    </span>
  );
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus | string }) {
  const styles: Record<string, string> = {
    [NotificationStatus.PENDING]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    [NotificationStatus.SENT]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [NotificationStatus.FAILED]: "bg-rose-500/15 text-rose-400 border-rose-500/30 font-medium",
    [NotificationStatus.RETRYING]: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  const style = styles[status] || "bg-surface-2 text-ink-muted border-hairline";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-mono border ${style}`}>
      {status}
    </span>
  );
}
