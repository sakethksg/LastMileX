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
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="admin-status-filter" className="sr-only">Filter by Status</label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
          icon={<ClipboardList className="h-7 w-7 text-gray-400" aria-hidden="true" />}
          title="No Orders Found"
          description={
            statusFilter || search
              ? "No orders match the current search or status filter criteria."
              : "No orders are currently present in the system."
          }
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">
                      {order.customer?.name || order.customer?.email || "Customer"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate">
                      {order.dropAddress}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      #{order.currentAttempt || 1}/{order.maxAttempts || 3}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-purple-600 transition"
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
