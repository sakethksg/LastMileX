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
  Compass,
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
    return <LoadingSkeleton message="Loading customer dashboard telemetry..." />;
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
        eyebrow="Customer Workspace"
        title="Customer Dashboard"
        subtitle="Track shipments, view active deliveries, and manage your orders"
        actions={
          <Link
            href="/orders/new"
            className="btn-primary"
          >
            <PackagePlus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create Shipment
          </Link>
        }
      />

      {/* Metrics Grid */}
      <section aria-label="Order summary metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
            <Package className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            Total Orders
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{overview.totalOrders}</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-amber-400">
            <Truck className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Active
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{overview.activeOrders}</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Delivered
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{overview.deliveredOrders}</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            Failed / Retry
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{overview.failedOrders}</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-subtle">
            <XCircle className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />
            Cancelled
          </div>
          <div className="mt-2 text-2xl font-bold text-ink-muted">{overview.cancelledOrders}</div>
        </div>
      </section>

      {/* Active Deliveries Banner */}
      {activeDeliveries.length > 0 && (
        <section aria-label="Active shipments" className="rounded-lg border border-hairline bg-surface-1 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-400" aria-hidden="true" />
              Active Shipments in Transit ({activeDeliveries.length})
            </h2>
            <span className="font-mono text-xs text-sky-400">LIVE DISPATCH</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {activeDeliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-md border border-hairline bg-surface-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-ink">{delivery.orderNumber}</span>
                  <OrderStatusBadge status={delivery.status} />
                </div>

                <div className="text-xs text-ink-muted space-y-1">
                  <div className="truncate">
                    <span className="text-ink-subtle">Destination: </span>
                    {delivery.dropAddress}
                  </div>
                  {delivery.assignedAgent && (
                    <div>
                      <span className="text-ink-subtle">Driver: </span>
                      {delivery.assignedAgent.name} ({delivery.assignedAgent.vehicleType || "Vehicle"})
                    </div>
                  )}
                </div>

                <Link
                  href={`/orders/${delivery.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs"
                >
                  View live progress <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders Table */}
      <section aria-label="Recent orders" className="card-surface-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-ink">Recent Orders</h2>
          <Link href="/orders" className="text-xs font-semibold text-sky-400 hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs">
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
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-hairline bg-surface-2 text-caption font-semibold uppercase text-ink-muted">
                  <tr>
                    <th scope="col" className="py-3 px-4">Order Number</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4">Latest Event</th>
                    <th scope="col" className="py-3 px-4">Date</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-2/50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-ink">{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted max-w-xs truncate">
                        {order.latestTrackingEvent?.note || "Order placed"}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-subtle font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="btn-secondary !px-2.5 !py-1 text-xs"
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
