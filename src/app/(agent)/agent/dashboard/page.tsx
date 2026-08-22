"use client";

import React, { useEffect, useState } from "react";
import { fetchAgentDashboard } from "@/lib/api/dashboard";
import { AgentDashboardData } from "@/types/domain";
import { OrderStatusBadge, AgentAvailabilityBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function AgentDashboardPage() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await fetchAgentDashboard();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load agent dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="text-lg font-bold">Error Loading Dashboard</h3>
        <p className="mt-1 text-sm">{error || "No data returned"}</p>
      </div>
    );
  }

  const { profile, activeOrders, metrics } = data;

  return (
    <div className="space-y-8">
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Agent Dashboard</h1>
          <p className="text-sm text-gray-500">Live dispatch workload, vehicle assignment, and delivery execution</p>
        </div>

        <div className="flex items-center gap-3">
          <AgentAvailabilityBadge availability={profile.availability} />
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200">
            {profile.vehicleType || "BIKE"} ({profile.vehicleNumber || "KA-01"})
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Truck className="h-4 w-4 text-blue-500" />
            Active Workload
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{profile.activeDeliveryCount}</span>
            <span className="text-xs text-gray-500">/ {profile.maxConcurrentOrders} max</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {profile.capacityRemaining} slots remaining
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Completed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{metrics.today.completed}</div>
          <div className="mt-1 text-[11px] text-gray-500">{metrics.allTime.completed} all-time</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Failed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{metrics.today.failed}</div>
          <div className="mt-1 text-[11px] text-gray-500">{metrics.allTime.failed} all-time</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">{metrics.successRate}%</div>
          <div className="mt-1 text-[11px] text-gray-500">Completion ratio</div>
        </div>
      </div>

      {/* Active Assigned Deliveries */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            Currently Assigned Deliveries ({activeOrders.length})
          </h2>
          <Link href="/agent/orders" className="text-xs font-semibold text-blue-600 hover:underline">
            View all assignments
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            You have no active deliveries assigned at this moment. You will be notified when auto-assigned.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-500">Pickup: </span>
                    {order.pickupAddress}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Drop: </span>
                    {order.dropAddress}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Payment: </span>
                    {order.paymentType}
                  </div>
                </div>

                <Link
                  href={`/agent/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Execute Delivery Actions <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
