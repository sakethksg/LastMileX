"use client";

import React, { useEffect, useState } from "react";
import { fetchAdminDashboard } from "@/lib/api/dashboard";
import { AdminDashboardData } from "@/types/domain";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  Package,
  Truck,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await fetchAdminDashboard();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="text-lg font-bold">Error Loading Admin Dashboard</h3>
        <p className="mt-1 text-sm">{error || "No data returned"}</p>
      </div>
    );
  }

  const { orders, deliveryPerformance, agentFleet, financialMetrics, recentOrders, recentFailures } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" />
            Operations Overview Dashboard
          </h1>
          <p className="text-sm text-gray-500">Live operational dispatch metrics, driver allocation, and financial KPIs</p>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Package className="h-4 w-4 text-blue-500" />
            Total Orders
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{orders.total}</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {orders.active} active ({orders.statusBreakdown.ASSIGNED || 0} assigned, {orders.statusBreakdown.OUT_FOR_DELIVERY || 0} out)
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{deliveryPerformance.successRate}%</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {deliveryPerformance.totalDelivered} delivered / {deliveryPerformance.totalFailed} failed
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Users className="h-4 w-4 text-purple-500" />
            Agent Fleet
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{agentFleet.totalAgents} Agents</div>
          <div className="mt-1 text-[11px] text-gray-500">
            {agentFleet.available} available, {agentFleet.atCapacity} at capacity
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <IndianRupee className="h-4 w-4 text-amber-500" />
            Revenue Snapshot
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            ₹{financialMetrics.totalOrderValue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            ₹{financialMetrics.deliveredOrderValue.toFixed(2)} fulfilled
          </div>
        </div>
      </div>

      {/* Grid: Agent Fleet Distribution & Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
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
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
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
        </div>
      </div>

      {/* Recent Orders & Failures */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Dispatches</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-bold text-gray-900">{order.orderNumber}</div>
                  <div className="text-gray-500 mt-0.5">{order.dropAddress}</div>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Delivery Failures */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Recent Delivery Failures ({recentFailures.length})
          </h2>

          {recentFailures.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No recent delivery failures recorded.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentFailures.map((failure) => (
                <div key={failure.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-gray-900">{failure.order?.orderNumber}</div>
                    <div className="text-red-600 mt-0.5 font-semibold">
                      Reason: {failure.failureReason?.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">Attempt #{failure.attemptNumber}</span>
                    <Link
                      href={`/admin/orders/${failure.orderId}`}
                      className="rounded border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reschedule
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
