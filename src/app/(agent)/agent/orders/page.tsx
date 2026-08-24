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

              <div className="space-y-2 text-xs text-ink-muted">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-product-waypoint shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="text-ink-subtle uppercase tracking-wider text-[10px]">Pickup: </span>
                    <span className="text-ink">{order.pickupAddress}</span> (PIN: {order.pickupPinCode})
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-product-nomad shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="text-ink-subtle uppercase tracking-wider text-[10px]">Drop: </span>
                    <span className="text-ink">{order.dropAddress}</span> (PIN: {order.dropPinCode})
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-hairline-soft flex items-center justify-between">
                <span className="text-xs font-mono text-ink-subtle">
                  Payment: <span className="text-ink font-semibold">{order.paymentType}</span>
                </span>
                <Link
                  href={`/agent/orders/${order.id}`}
                  className="btn-product-vault !px-3 !py-1 text-xs"
                >
                  Execute Delivery <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
