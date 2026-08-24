"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchCustomerOrders } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { PackagePlus } from "lucide-react";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCustomerOrders({ status: statusFilter || undefined });
      setOrders(res.items || res.orders || (Array.isArray(res) ? res : []));
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shipment Management"
        title="My Shipments"
        subtitle="View, track, and manage all your delivery shipments"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="customer-status-filter" className="sr-only">Filter by Order Status</label>
              <select
                id="customer-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-surface !py-2 text-xs"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Link
              href="/orders/new"
              className="btn-primary"
            >
              <PackagePlus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Order
            </Link>
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton variant="table" message="Loading your orders..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Orders"
          message={error}
          onRetry={loadOrders}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title={statusFilter ? "No matching shipments" : "No shipments found"}
          description={
            statusFilter
              ? `No orders currently match the "${statusFilter}" status filter.`
              : "You have not placed any shipment orders yet."
          }
          actionText={statusFilter ? undefined : "Create First Shipment"}
          actionHref={statusFilter ? undefined : "/orders/new"}
        />
      ) : (
        <div className="card-surface-1 overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="py-3 px-4">Tracking Number</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Drop Destination</th>
                  <th scope="col" className="py-3 px-4">Payment</th>
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted max-w-xs truncate">
                      {order.dropAddress}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-ink-muted">
                      {order.paymentType}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-subtle font-mono">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="btn-secondary !px-2.5 !py-1 text-xs"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
