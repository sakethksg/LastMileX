"use client";

import React, { useEffect, useState } from "react";
import { fetchAgentAssignedOrders } from "@/lib/api/agents";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { Truck, ArrowRight, Loader2, MapPin } from "lucide-react";

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetchAgentAssignedOrders();
        setOrders(Array.isArray(res) ? res : res.orders || res.items || []);
      } catch (err: any) {
        setError(err.message || "Failed to load assigned orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assigned Deliveries</h1>
        <p className="text-sm text-gray-500">Pick up packages, navigate dispatches, and execute delivery handoffs</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <Truck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">No active delivery assignments</h3>
          <p className="mt-1 text-sm text-gray-500">New dispatches assigned to your route will appear here.</p>
        </div>
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
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-700">Pickup: </span>
                    {order.pickupAddress} (PIN: {order.pickupPinCode})
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Execute Delivery <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
