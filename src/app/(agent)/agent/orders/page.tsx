"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAgentAssignedOrders } from "@/lib/api/agents";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { Truck, ArrowRight, MapPin } from "lucide-react";

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAgentAssignedOrders();
      setOrders(Array.isArray(res) ? res : res.orders || res.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load assigned orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Route Execution"
        title="Assigned Deliveries"
        subtitle="Pick up packages, navigate dispatches, and execute delivery handoffs"
      />

      {loading ? (
        <LoadingSkeleton variant="card" message="Loading assigned delivery dispatches..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Deliveries"
          message={error}
          onRetry={loadOrders}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
          title="No Active Assignments"
          description="You currently have no active deliveries assigned. New route dispatches will appear here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card-surface-1 space-y-4">
              <div className="flex items-center justify-between border-b border-hairline-soft pb-3">
                <span className="font-mono text-sm font-bold text-ink">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>

                <div className="text-xs text-ink-muted space-y-1.5 pt-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-ink-subtle font-mono uppercase text-[10px] block">Pickup</span>
                      <span className="text-ink truncate block">{order.pickupAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-ink-subtle font-mono uppercase text-[10px] block">Drop</span>
                      <span className="text-ink truncate block">{order.dropAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-hairline-soft">
                  <div className="text-xs text-ink-subtle font-mono">
                    Payment: <span className="text-ink font-semibold">{order.paymentType}</span>
                  </div>
                  <Link
                    href={`/agent/orders/${order.id}`}
                    className="btn-primary !px-3 !py-1 text-xs"
                  >
                    Execute Actions <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                  </Link>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
