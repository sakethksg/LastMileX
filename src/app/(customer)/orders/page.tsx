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
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
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
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="py-3 px-4">Tracking Number</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Drop Destination</th>
                  <th scope="col" className="py-3 px-4">Payment</th>
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate">
                      {order.dropAddress}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      {order.paymentType}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
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
