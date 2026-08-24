"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminOrders } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminOrders({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setOrders(res.items || res.orders || (Array.isArray(res) ? res : []));
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dispatch Operations"
        title="Orders & Dispatch Management"
        subtitle="Monitor all dispatches, assign drivers, and handle retries"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="admin-order-search" className="sr-only">Search order number</label>
              <input
                id="admin-order-search"
                type="text"
                placeholder="Search order number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-surface !py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="admin-status-filter" className="sr-only">Filter by Status</label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-surface !py-2 text-xs"
              >
                <option value="">All Statuses</option>
                <option value="CREATED">Created</option>
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
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton variant="table" message="Loading dispatch orders..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Orders"
          message={error}
          onRetry={loadOrders}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
          title="No Orders Found"
          description={
            statusFilter || search
              ? "No orders match the current search or status filter criteria."
              : "No orders are currently present in the system."
          }
        />
      ) : (
        <div className="card-surface-1 overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Order Number</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Customer</th>
                  <th scope="col" className="py-3.5 px-4">Drop Address</th>
                  <th scope="col" className="py-3.5 px-4">Attempt</th>
                  <th scope="col" className="py-3.5 px-4">Date</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted font-medium">
                      {order.customer?.name || order.customer?.email || "Customer"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted max-w-xs truncate">
                      {order.dropAddress}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-ink-muted">
                      #{order.currentAttempt || 1}/{order.maxAttempts || 3}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-subtle font-mono">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn-secondary !px-2.5 !py-1 text-xs"
                      >
                        Inspect & Assign
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
