"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchAgentDashboard } from "@/lib/api/dashboard";
import { AgentDashboardData } from "@/types/domain";
import { OrderStatusBadge, AgentAvailabilityBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AgentDashboardPage() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAgentDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load agent dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <LoadingSkeleton message="Loading agent workload and metrics..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Agent Dashboard Error"
        message={error || "Could not retrieve driver telemetry."}
        onRetry={loadDashboard}
      />
    );
  }

  const { profile, activeOrders, metrics } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Delivery Agent Dashboard"
        subtitle="Live dispatch workload, vehicle assignment, and delivery execution"
        actions={
          <div className="flex items-center gap-3">
            <AgentAvailabilityBadge availability={profile.availability} />
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200">
              {profile.vehicleType || "BIKE"} ({profile.vehicleNumber || "KA-01"})
            </span>
          </div>
        }
      />

      {/* Metrics Cards */}
      <section aria-label="Performance metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Truck className="h-4 w-4 text-blue-500" aria-hidden="true" />
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
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Completed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{metrics.today.completed}</div>
          <div className="mt-1 text-[11px] text-gray-500">{metrics.allTime.completed} all-time</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
            Failed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{metrics.today.failed}</div>
          <div className="mt-1 text-[11px] text-gray-500">{metrics.allTime.failed} all-time</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <TrendingUp className="h-4 w-4 text-purple-500" aria-hidden="true" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">{metrics.successRate}%</div>
          <div className="mt-1 text-[11px] text-gray-500">Completion ratio</div>
        </div>
      </section>

      {/* Active Assigned Deliveries */}
      <section aria-label="Assigned deliveries" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Currently Assigned Deliveries ({activeOrders.length})
          </h2>
          <Link href="/agent/orders" className="text-xs font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
            View all assignments
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-7 w-7 text-gray-400" aria-hidden="true" />}
            title="No Active Assignments"
            description="You have no deliveries assigned at this moment. You will be automatically notified when auto-assigned to a route."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div className="truncate">
                    <span className="font-semibold text-gray-500">Pickup: </span>
                    {order.pickupAddress}
                  </div>
                  <div className="truncate">
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
                >
                  Execute Delivery Actions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
