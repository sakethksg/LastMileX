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

  const { orders, deliveryPerformance, agentFleet, financialMetrics, recentOrders, recentFailures } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations Overview"
        subtitle="Live operational dispatch metrics, driver allocation, and financial KPIs"
      />

      {/* Top 4 KPI Metrics */}
      <section aria-label="Key performance indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Total Orders
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{orders.total}</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {orders.active} active ({orders.statusBreakdown.ASSIGNED || 0} assigned, {orders.statusBreakdown.OUT_FOR_DELIVERY || 0} out)
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{deliveryPerformance.successRate}%</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {deliveryPerformance.totalDelivered} delivered / {deliveryPerformance.totalFailed} failed
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Users className="h-4 w-4 text-purple-500" aria-hidden="true" />
            Agent Fleet
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{agentFleet.totalAgents} Agents</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {agentFleet.available} available, {agentFleet.atCapacity} at capacity
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <IndianRupee className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Revenue Snapshot
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            ₹{financialMetrics.totalOrderValue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            ₹{financialMetrics.deliveredOrderValue.toFixed(2)} fulfilled
          </div>
        </div>
      </section>

      {/* Grid: Agent Fleet Distribution & Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <section aria-label="Agent availability distribution" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" aria-hidden="true" />
            Delivery Agent Availability Distribution
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-green-800">AVAILABLE</div>
              <div className="text-xl font-bold text-green-900 mt-1">{agentFleet.available}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-amber-800">BUSY</div>
              <div className="text-xl font-bold text-amber-900 mt-1">{agentFleet.busy}</div>
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-gray-700">OFFLINE</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{agentFleet.offline}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-red-800">AT CAPACITY</div>
              <div className="text-xl font-bold text-red-900 mt-1">{agentFleet.atCapacity}</div>
            </div>
          </div>
        </section>

        <section aria-label="Order status breakdown" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Order State Breakdown
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            {Object.entries(orders.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-semibold text-gray-700">{status}</span>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Orders & Failures */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section aria-label="Recent dispatches" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Dispatches</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
              View All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              title="No recent dispatches"
              description="No recent orders recorded."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <div className="font-mono font-bold text-gray-900">{order.orderNumber}</div>
                    <div className="text-gray-500 mt-0.5 truncate">{order.dropAddress}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600"
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
        <section aria-label="Recent delivery failures" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Recent Delivery Failures ({recentFailures.length})
            </h2>
          </div>

          {recentFailures.length === 0 ? (
            <EmptyState
              title="Zero Failures"
              description="No recent delivery failures recorded in the operations pipeline."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentFailures.map((failure) => (
                <div key={failure.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <div className="font-mono font-bold text-gray-900">{failure.order?.orderNumber}</div>
                    <div className="text-red-600 mt-0.5 font-semibold truncate">
                      Reason: {failure.failureReason?.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-gray-400">Attempt #{failure.attemptNumber}</span>
                    <Link
                      href={`/admin/orders/${failure.orderId}`}
                      className="rounded border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600"
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
