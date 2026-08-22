"use client";

import React, { useEffect, useState } from "react";
import { fetchCustomerDashboard } from "@/lib/api/dashboard";
import { CustomerDashboardData } from "@/types/domain";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  PackagePlus,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchCustomerDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSkeleton message="Loading customer dashboard..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard Unavailable"
        message={error || "Unable to fetch dashboard telemetry."}
        onRetry={loadDashboard}
      />
    );
  }

  const { overview, activeDeliveries, recentOrders } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Dashboard"
        subtitle="Track shipments, view active deliveries, and manage your orders"
        actions={
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
          >
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Create Shipment
          </Link>
        }
      />

      {/* Metrics Grid */}
      <section aria-label="Order summary metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Total Orders
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{overview.totalOrders}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Truck className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Active
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{overview.activeOrders}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Delivered
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{overview.deliveredOrders}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
            Failed / Retry
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{overview.failedOrders}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <XCircle className="h-4 w-4 text-gray-400" aria-hidden="true" />
            Cancelled
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-600">{overview.cancelledOrders}</div>
        </div>
      </section>

      {/* Active Deliveries Banner */}
      {activeDeliveries.length > 0 && (
        <section aria-label="Active shipments" className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Active Shipments in Transit ({activeDeliveries.length})
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {activeDeliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gray-900">{delivery.orderNumber}</span>
                  <OrderStatusBadge status={delivery.status} />
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div className="truncate">
                    <span className="font-semibold text-gray-500">To: </span>
                    {delivery.dropAddress}
                  </div>
                  {delivery.assignedAgent && (
                    <div>
                      <span className="font-semibold text-gray-500">Driver: </span>
                      {delivery.assignedAgent.name} ({delivery.assignedAgent.vehicleType || "Vehicle"})
                    </div>
                  )}
                </div>

                <Link
                  href={`/orders/${delivery.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                >
                  View live progress <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders Table */}
      <section aria-label="Recent orders" className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
            View all orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="You haven't placed any shipment orders yet. Create your first delivery to get started."
            actionText="Create Shipment"
            actionHref="/orders/new"
          />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th scope="col" className="py-3 px-4">Order Number</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4">Latest Event</th>
                    <th scope="col" className="py-3 px-4">Date</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                        {order.latestTrackingEvent?.note || "Order placed"}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
