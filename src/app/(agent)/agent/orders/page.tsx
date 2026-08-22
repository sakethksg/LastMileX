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
          icon={<Truck className="h-7 w-7 text-gray-400" aria-hidden="true" />}
          title="No Active Assignments"
          description="You currently have no active deliveries assigned. New route dispatches will appear here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-gray-700">Pickup: </span>
                    {order.pickupAddress} (PIN: {order.pickupPinCode})
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-gray-700">Drop: </span>
                    {order.dropAddress} (PIN: {order.dropPinCode})
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  Payment: <span className="text-gray-900">{order.paymentType}</span>
                </span>
                <Link
                  href={`/agent/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
                >
                  Execute Delivery <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
