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
    return <LoadingSkeleton message="Loading driver telemetry and workload..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Driver Dashboard Error"
        message={error || "Could not retrieve driver telemetry."}
        onRetry={loadDashboard}
      />
    );
  }

  const { profile, activeOrders, metrics } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Driver Operations"
        title="Driver Dispatch Dashboard"
        subtitle="Live dispatch workload, vehicle assignment, and delivery execution"
        actions={
          <div className="flex items-center gap-3">
            <AgentAvailabilityBadge availability={profile.availability} />
            <span className="rounded-xs bg-surface-2 px-3 py-1.5 text-xs font-mono font-semibold text-ink border border-hairline">
              {profile.vehicleType || "BIKE"} ({profile.vehicleNumber || "KA-01"})
            </span>
          </div>
        }
      />

      {/* Metrics Cards */}
      <section aria-label="Performance metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-product-vault">
            <Truck className="h-3.5 w-3.5 text-product-vault" aria-hidden="true" />
            Active Workload
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{profile.activeDeliveryCount}</span>
            <span className="text-xs text-ink-subtle font-mono">/ {profile.maxConcurrentOrders} max</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-muted font-mono">
            {profile.capacityRemaining} slots remaining
          </div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-product-nomad">
            <CheckCircle2 className="h-3.5 w-3.5 text-product-nomad" aria-hidden="true" />
            Completed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-product-nomad">{metrics.today.completed}</div>
          <div className="mt-1 text-[11px] text-ink-subtle font-mono">{metrics.allTime.completed} all-time</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-product-consul">
            <AlertTriangle className="h-3.5 w-3.5 text-product-consul" aria-hidden="true" />
            Failed Today
          </div>
          <div className="mt-2 text-2xl font-bold text-product-consul">{metrics.today.failed}</div>
          <div className="mt-1 text-[11px] text-ink-subtle font-mono">{metrics.allTime.failed} all-time</div>
        </div>

        <div className="card-surface-1 p-5">
          <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-eyebrow text-product-terraform-bright">
            <TrendingUp className="h-3.5 w-3.5 text-product-terraform-bright" aria-hidden="true" />
            Success Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-product-terraform-bright">{metrics.successRate}%</div>
          <div className="mt-1 text-[11px] text-ink-subtle font-mono">Completion ratio</div>
        </div>
      </section>

      {/* Active Assigned Deliveries */}
      <section aria-label="Assigned deliveries" className="card-surface-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Layers className="h-5 w-5 text-product-vault" aria-hidden="true" />
            Currently Assigned Deliveries ({activeOrders.length})
          </h2>
          <Link href="/agent/orders" className="text-xs font-semibold text-product-vault hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue rounded-xs">
            View all assignments
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
            title="No Active Assignments"
            description="You have no deliveries assigned at this moment. You will be automatically notified when auto-assigned to a route."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-md border border-hairline bg-surface-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-ink">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="text-xs text-ink-muted space-y-1">
                  <div className="truncate">
                    <span className="text-ink-subtle">Pickup: </span>
                    {order.pickupAddress}
                  </div>
                  <div className="truncate">
                    <span className="text-ink-subtle">Drop: </span>
                    {order.dropAddress}
                  </div>
                  <div>
                    <span className="text-ink-subtle">Payment: </span>
                    <span className="font-mono text-ink">{order.paymentType}</span>
                  </div>
                </div>

                <Link
                  href={`/agent/orders/${order.id}`}
                  className="btn-product-vault !px-3 !py-1.5 text-xs w-full text-center"
                >
                  Execute Delivery Actions <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
