"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminDashboard } from "@/lib/api/dashboard";
import { AdminDashboardData } from "@/types/domain";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import {
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAdminDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <LoadingSkeleton message="Loading operations telemetry and fleet analytics..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Operations Dashboard Error"
        message={error || "Could not retrieve system metrics."}
        onRetry={loadDashboard}
      />
    );
  }

  const { overview, deliveryMetrics, agents, financials, ordersByStatus, recentOrders, recentFailures } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations Console"
        title="Operations Overview"
        subtitle="Live operational dispatch metrics, driver allocation, and financial KPIs"
      />

      {/* Top 4 KPI Metrics */}
      <section aria-label="Key performance indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-sky-400">
            <Package className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            Total Orders
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{overview.totalOrders}</div>
          <div className="mt-1 text-[11px] text-ink-muted font-mono">
            {overview.activeOrders} active ({ordersByStatus.find((item) => item.status === "ASSIGNED")?.count || 0} assigned, {ordersByStatus.find((item) => item.status === "OUT_FOR_DELIVERY")?.count || 0} out)
          </div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{deliveryMetrics.successRate}%</div>
          <div className="mt-1 text-[11px] text-ink-muted font-mono">
            {deliveryMetrics.completedToday} completed today / {deliveryMetrics.failedToday} failed today
          </div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-indigo-400">
            <Users className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            Agent Fleet
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{agents.total} Agents</div>
          <div className="mt-1 text-[11px] text-ink-muted font-mono">
            {agents.available} available, {agents.atCapacity} at capacity
          </div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-amber-400">
            <IndianRupee className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Revenue Snapshot
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">
            ₹{financials.totalOrderValue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted font-mono">
            ₹{financials.deliveredOrderValue.toFixed(2)} fulfilled
          </div>
        </div>
      </section>

      {/* Grid: Agent Fleet Distribution & Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <section aria-label="Agent availability distribution" className="card-surface-1 space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Fleet Availability Distribution
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-center">
              <div className="text-eyebrow font-bold text-emerald-400">AVAILABLE</div>
              <div className="text-xl font-bold text-ink mt-1 font-mono">{agents.available}</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-center">
              <div className="text-eyebrow font-bold text-amber-400">BUSY</div>
              <div className="text-xl font-bold text-ink mt-1 font-mono">{agents.busy}</div>
            </div>
            <div className="bg-surface-2 border border-hairline rounded-md p-3 text-center">
              <div className="text-eyebrow font-bold text-ink-muted">OFFLINE</div>
              <div className="text-xl font-bold text-ink mt-1 font-mono">{agents.offline}</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-3 text-center">
              <div className="text-eyebrow font-bold text-rose-400">AT CAPACITY</div>
              <div className="text-xl font-bold text-ink mt-1 font-mono">{agents.atCapacity}</div>
            </div>
          </div>
        </section>

        <section aria-label="Order status breakdown" className="card-surface-1 space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Package className="h-5 w-5 text-sky-400" aria-hidden="true" />
            Order State Matrix
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            {ordersByStatus.map(({ status, count }) => (
              <div key={status} className="flex justify-between items-center p-2.5 rounded-md bg-surface-2 border border-hairline font-mono">
                <span className="font-semibold text-ink-muted text-[11px]">{status}</span>
                <span className="font-bold text-ink">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Orders & Failures */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section aria-label="Recent dispatches" className="card-surface-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Recent Dispatches</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-sky-400 hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs">
              View All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              title="No recent dispatches"
              description="No recent orders recorded."
            />
          ) : (
            <div className="divide-y divide-hairline-soft">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <div className="font-mono font-bold text-ink">{order.orderNumber}</div>
                    <div className="text-ink-muted mt-0.5 truncate">{order.dropAddress}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="btn-secondary !px-2.5 !py-1 text-[11px]"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Delivery Failures */}
        <section aria-label="Recent delivery failures" className="card-surface-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Recent Delivery Failures ({recentFailures.length})
            </h2>
          </div>

          {recentFailures.length === 0 ? (
            <EmptyState
              title="Zero Failures"
              description="No recent delivery failures recorded in the operations pipeline."
            />
          ) : (
            <div className="divide-y divide-hairline-soft">
              {recentFailures.map((failure) => (
                <div key={failure.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <div className="font-mono font-bold text-ink">{failure.order?.orderNumber}</div>
                    <div className="text-rose-400 mt-0.5 font-semibold truncate font-mono text-[11px]">
                      Reason: {failure.failureReason?.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-ink-subtle">Attempt #{failure.attemptNumber}</span>
                    <Link
                      href={`/admin/orders/${failure.order?.id}`}
                      className="btn-secondary !px-2.5 !py-1 text-[11px]"
                    >
                      Reschedule
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
